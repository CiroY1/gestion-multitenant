using System.Data;
using Gestion.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace Gestion.Api.Inventario;

/// <summary>Resultado de aplicar un movimiento de stock.</summary>
public record MovimientoResultado(bool Ok, decimal CostoMovimiento, int Saldo, decimal CostoPromedio);

/// <summary>
/// Punto único por el que pasan TODOS los movimientos de stock. Mantiene la
/// existencia por bodega, el costo promedio ponderado (global) del producto y el
/// saldo total, y deja la traza (kardex). La actualización es atómica y se
/// enlista en la transacción activa del DbContext.
/// </summary>
public class KardexService
{
    private readonly AppDbContext _db;

    public KardexService(AppDbContext db) => _db = db;

    /// <summary>
    /// Devuelve una bodega válida del tenant: la indicada (si existe y está activa)
    /// o, si no se indica, la primera activa. Null si no hay ninguna.
    /// </summary>
    public async Task<int?> ResolverBodegaAsync(string tenant, int? bodegaId)
    {
        if (bodegaId is int id)
        {
            var ok = await _db.Bodegas.AnyAsync(b => b.Id == id && b.TenantId == tenant && b.Activa);
            return ok ? id : null;
        }
        return await _db.Bodegas
            .Where(b => b.TenantId == tenant && b.Activa)
            .OrderBy(b => b.Id)
            .Select(b => (int?)b.Id)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Aplica un movimiento en una bodega. En entradas con <paramref name="costoEntrada"/>
    /// recalcula el costo promedio; en salidas y entradas sin costo usa el promedio vigente.
    /// La guardia de stock de las salidas se valida contra la EXISTENCIA DE LA BODEGA.
    /// Devuelve Ok=false si la bodega no tiene stock suficiente (no registra nada).
    /// </summary>
    public async Task<MovimientoResultado> MoverAsync(
        int productoId, string tenant, int bodegaId, TipoMovimiento tipo, int cantidad,
        decimal? costoEntrada, string docTipo, string? docNumero, string? concepto)
    {
        // 1) Existencia de la bodega (con guardia en salidas).
        if (tipo == TipoMovimiento.Salida)
        {
            var filas = await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE ""ExistenciaBodegas"" SET ""Stock"" = ""Stock"" - {cantidad}
                   WHERE ""TenantId"" = {tenant} AND ""ProductoId"" = {productoId}
                     AND ""BodegaId"" = {bodegaId} AND ""Stock"" >= {cantidad}");
            if (filas == 0)
                return new MovimientoResultado(false, 0m, 0, 0m);
        }
        else
        {
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"INSERT INTO ""ExistenciaBodegas"" (""ProductoId"", ""BodegaId"", ""Stock"", ""TenantId"")
                   VALUES ({productoId}, {bodegaId}, {cantidad}, {tenant})
                   ON CONFLICT (""TenantId"", ""ProductoId"", ""BodegaId"")
                   DO UPDATE SET ""Stock"" = ""ExistenciaBodegas"".""Stock"" + {cantidad}");
        }

        // 2) Producto: stock total + costo promedio global.
        string sql;
        if (tipo == TipoMovimiento.Entrada && costoEntrada.HasValue)
        {
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
            sql = @"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" + @qty
                    WHERE ""Id"" = @id AND ""TenantId"" = @t RETURNING ""Stock"", ""CostoPromedio"";";
        }
        else
        {
            sql = @"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" - @qty
                    WHERE ""Id"" = @id AND ""TenantId"" = @t RETURNING ""Stock"", ""CostoPromedio"";";
        }

        var fila = await EjecutarAsync(sql, productoId, tenant, cantidad, costoEntrada ?? 0m);
        var (saldo, promedio) = fila!.Value;

        var costoMov = (tipo == TipoMovimiento.Entrada && costoEntrada.HasValue)
            ? costoEntrada.Value
            : promedio;

        // 3) Traza en el kardex (con la bodega).
        _db.MovimientosStock.Add(new MovimientoStock
        {
            ProductoId = productoId,
            BodegaId = bodegaId,
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
        return (reader.GetInt32(0), reader.GetDecimal(1));
    }
}
