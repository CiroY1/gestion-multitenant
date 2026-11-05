using System.Data;
using Gestion.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace Gestion.Api.Inventario;

/// <summary>Resultado de aplicar un movimiento de stock.</summary>
public record MovimientoResultado(bool Ok, decimal CostoMovimiento, int Saldo, decimal CostoPromedio);

/// <summary>
/// Punto único por el que pasan TODOS los movimientos de stock. Mantiene el costo
/// promedio ponderado del producto y deja la traza (kardex) con saldo corrido.
/// La actualización de stock y costo es atómica (UPDATE ... RETURNING) y se enlista
/// en la transacción activa del DbContext.
/// </summary>
public class KardexService
{
    private readonly AppDbContext _db;

    public KardexService(AppDbContext db) => _db = db;

    /// <summary>
    /// Aplica un movimiento. En entradas con <paramref name="costoEntrada"/> recalcula
    /// el costo promedio; en salidas y entradas sin costo usa el costo promedio vigente.
    /// Devuelve Ok=false si una salida no tiene stock suficiente (no registra nada).
    /// </summary>
    public async Task<MovimientoResultado> MoverAsync(
        int productoId, string tenant, TipoMovimiento tipo, int cantidad,
        decimal? costoEntrada, string docTipo, string? docNumero, string? concepto)
    {
        string sql;
        if (tipo == TipoMovimiento.Entrada && costoEntrada.HasValue)
        {
            // Entrada con costo: recalcula el promedio ponderado.
            sql = @"
                UPDATE ""Productos""
                SET ""CostoPromedio"" = CASE WHEN (""Stock"" + @qty) > 0
                        THEN ((""Stock"" * ""CostoPromedio"") + (@qty * @cost)) / (""Stock"" + @qty)
                        ELSE ""CostoPromedio"" END,
                    ""Stock"" = ""Stock"" + @qty
                WHERE ""Id"" = @id AND ""TenantId"" = @t
                RETURNING ""Stock"", ""CostoPromedio"";";
        }
        else if (tipo == TipoMovimiento.Entrada)
        {
            // Entrada sin costo (devolución / reversa): el promedio no cambia.
            sql = @"
                UPDATE ""Productos"" SET ""Stock"" = ""Stock"" + @qty
                WHERE ""Id"" = @id AND ""TenantId"" = @t
                RETURNING ""Stock"", ""CostoPromedio"";";
        }
        else
        {
            // Salida: resta con guardia de stock suficiente.
            sql = @"
                UPDATE ""Productos"" SET ""Stock"" = ""Stock"" - @qty
                WHERE ""Id"" = @id AND ""TenantId"" = @t AND ""Stock"" >= @qty
                RETURNING ""Stock"", ""CostoPromedio"";";
        }

        var fila = await EjecutarAsync(sql, productoId, tenant, cantidad, costoEntrada ?? 0m);
        if (fila is null)
            return new MovimientoResultado(false, 0m, 0, 0m);

        var (saldo, promedio) = fila.Value;

        // Costo del movimiento: el de compra en entradas con costo; el promedio vigente en el resto.
        var costoMov = (tipo == TipoMovimiento.Entrada && costoEntrada.HasValue)
            ? costoEntrada.Value
            : promedio;

        _db.MovimientosStock.Add(new MovimientoStock
        {
            ProductoId = productoId,
            Tipo = tipo,
            Cantidad = cantidad,
            CostoUnitario = costoMov,
            SaldoCantidad = saldo,
            CostoPromedio = promedio,
            Fecha = DateTime.UtcNow,
            DocumentoTipo = docTipo,
            DocumentoNumero = docNumero,
            Concepto = concepto,
            TenantId = tenant,
        });

        return new MovimientoResultado(true, costoMov, saldo, promedio);
    }

    private async Task<(int saldo, decimal promedio)?> EjecutarAsync(
        string sql, int productoId, string tenant, int cantidad, decimal costo)
    {
        var conn = _db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
            await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        var tx = _db.Database.CurrentTransaction;
        if (tx is not null)
            cmd.Transaction = tx.GetDbTransaction();

        cmd.CommandText = sql;
        cmd.Parameters.Add(new NpgsqlParameter("id", productoId));
        cmd.Parameters.Add(new NpgsqlParameter("t", tenant));
        cmd.Parameters.Add(new NpgsqlParameter("qty", cantidad));
        cmd.Parameters.Add(new NpgsqlParameter("cost", costo));

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;
        var saldo = reader.GetInt32(0);
        var promedio = reader.GetDecimal(1);
        return (saldo, promedio);
    }
}
