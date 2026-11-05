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
/// existencia por bodega y por lote, el costo promedio ponderado (global) del
/// producto y el saldo total, y deja la traza (kardex). Las salidas de productos
/// que rastrean lotes consumen por FEFO (primero el que vence antes). Todo es
/// atómico dentro de la transacción activa del DbContext.
/// </summary>
public class KardexService
{
    private readonly AppDbContext _db;

    public KardexService(AppDbContext db) => _db = db;

    public async Task<int?> ResolverBodegaAsync(string tenant, int? bodegaId)
    {
        if (bodegaId is int id)
        {
            var ok = await _db.Bodegas.AnyAsync(b => b.Id == id && b.TenantId == tenant && b.Activa);
            return ok ? id : null;
        }
        return await _db.Bodegas
            .Where(b => b.TenantId == tenant && b.Activa)
            .OrderBy(b => b.Id).Select(b => (int?)b.Id).FirstOrDefaultAsync();
    }

    public async Task<MovimientoResultado> MoverAsync(
        int productoId, string tenant, int bodegaId, TipoMovimiento tipo, int cantidad,
        decimal? costoEntrada, string docTipo, string? docNumero, string? concepto, int? loteId = null)
    {
        var rastrea = await _db.Productos
            .Where(p => p.Id == productoId && p.TenantId == tenant)
            .Select(p => p.RastreaLotes).FirstOrDefaultAsync();

        return tipo == TipoMovimiento.Entrada
            ? await EntradaAsync(productoId, tenant, bodegaId, cantidad, costoEntrada, docTipo, docNumero, concepto, rastrea, loteId)
            : await SalidaAsync(productoId, tenant, bodegaId, cantidad, docTipo, docNumero, concepto, rastrea);
    }

    private async Task<MovimientoResultado> EntradaAsync(
        int prod, string t, int bod, int qty, decimal? costoEntrada,
        string docTipo, string? docNum, string? concepto, bool rastrea, int? loteId)
    {
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"INSERT INTO ""ExistenciaBodegas"" (""ProductoId"", ""BodegaId"", ""Stock"", ""TenantId"")
               VALUES ({prod}, {bod}, {qty}, {t})
               ON CONFLICT (""TenantId"", ""ProductoId"", ""BodegaId"")
               DO UPDATE SET ""Stock"" = ""ExistenciaBodegas"".""Stock"" + {qty}");

        int? loteUsado = null;
        if (rastrea)
        {
            loteUsado = loteId ?? await LoteGeneralAsync(prod, t);
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"INSERT INTO ""ExistenciaLotes"" (""ProductoId"", ""BodegaId"", ""LoteId"", ""Stock"", ""TenantId"")
                   VALUES ({prod}, {bod}, {loteUsado}, {qty}, {t})
                   ON CONFLICT (""TenantId"", ""ProductoId"", ""BodegaId"", ""LoteId"")
                   DO UPDATE SET ""Stock"" = ""ExistenciaLotes"".""Stock"" + {qty}");
        }

        var sql = costoEntrada.HasValue
            ? @"UPDATE ""Productos""
                SET ""CostoPromedio"" = CASE WHEN (""Stock"" + @qty) > 0
                        THEN ((""Stock"" * ""CostoPromedio"") + (@qty * @cost)) / (""Stock"" + @qty)
                        ELSE ""CostoPromedio"" END,
                    ""Stock"" = ""Stock"" + @qty
                WHERE ""Id"" = @id AND ""TenantId"" = @t RETURNING ""Stock"", ""CostoPromedio"";"
            : @"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" + @qty
                WHERE ""Id"" = @id AND ""TenantId"" = @t RETURNING ""Stock"", ""CostoPromedio"";";

        var (saldo, prom) = (await EjecutarAsync(sql, prod, t, qty, costoEntrada ?? 0m))!.Value;
        var costoMov = costoEntrada ?? prom;
        AddMov(prod, bod, loteUsado, TipoMovimiento.Entrada, qty, costoMov, saldo, prom, docTipo, docNum, concepto, t);
        return new MovimientoResultado(true, costoMov, saldo, prom);
    }

    private async Task<MovimientoResultado> SalidaAsync(
        int prod, string t, int bod, int qty, string docTipo, string? docNum, string? concepto, bool rastrea)
    {
        // Guardia a nivel de bodega (total).
        var filas = await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE ""ExistenciaBodegas"" SET ""Stock"" = ""Stock"" - {qty}
               WHERE ""TenantId"" = {t} AND ""ProductoId"" = {prod}
                 AND ""BodegaId"" = {bod} AND ""Stock"" >= {qty}");
        if (filas == 0) return new MovimientoResultado(false, 0m, 0, 0m);

        var minus = @"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" - @qty
                      WHERE ""Id"" = @id AND ""TenantId"" = @t RETURNING ""Stock"", ""CostoPromedio"";";
        var (saldo, prom) = (await EjecutarAsync(minus, prod, t, qty, 0m))!.Value;

        if (!rastrea)
        {
            AddMov(prod, bod, null, TipoMovimiento.Salida, qty, prom, saldo, prom, docTipo, docNum, concepto, t);
            return new MovimientoResultado(true, prom, saldo, prom);
        }

        // FEFO: consumir de los lotes de esa bodega, el que vence antes primero.
        var lotes = await _db.ExistenciaLotes
            .Where(e => e.TenantId == t && e.ProductoId == prod && e.BodegaId == bod && e.Stock > 0)
            .OrderBy(e => e.Lote!.FechaVencimiento == null)
            .ThenBy(e => e.Lote!.FechaVencimiento)
            .ThenBy(e => e.LoteId)
            .Select(e => new { e.LoteId, e.Stock })
            .ToListAsync();

        var restante = qty;
        foreach (var l in lotes)
        {
            if (restante <= 0) break;
            var alloc = Math.Min(restante, l.Stock);
            var f = await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE ""ExistenciaLotes"" SET ""Stock"" = ""Stock"" - {alloc}
                   WHERE ""TenantId"" = {t} AND ""ProductoId"" = {prod}
                     AND ""BodegaId"" = {bod} AND ""LoteId"" = {l.LoteId} AND ""Stock"" >= {alloc}");
            if (f == 0) return new MovimientoResultado(false, 0m, 0, 0m);
            AddMov(prod, bod, l.LoteId, TipoMovimiento.Salida, alloc, prom, saldo, prom, docTipo, docNum, concepto, t);
            restante -= alloc;
        }
        if (restante > 0) return new MovimientoResultado(false, 0m, 0, 0m); // lotes insuficientes

        return new MovimientoResultado(true, prom, saldo, prom);
    }

    /// <summary>Lote "GENERAL" (sin vencimiento) del producto; lo crea si no existe.</summary>
    private async Task<int> LoteGeneralAsync(int prod, string t)
    {
        var conn = _db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        var tx = _db.Database.CurrentTransaction;
        if (tx is not null) cmd.Transaction = tx.GetDbTransaction();
        cmd.CommandText = @"
            INSERT INTO ""Lotes"" (""ProductoId"", ""Codigo"", ""FechaVencimiento"", ""TenantId"")
            VALUES (@p, 'GENERAL', NULL, @t)
            ON CONFLICT (""TenantId"", ""ProductoId"", ""Codigo"")
            DO UPDATE SET ""Codigo"" = EXCLUDED.""Codigo""
            RETURNING ""Id"";";
        cmd.Parameters.Add(new NpgsqlParameter("p", prod));
        cmd.Parameters.Add(new NpgsqlParameter("t", t));
        return (int)(await cmd.ExecuteScalarAsync())!;
    }

    private void AddMov(int prod, int bod, int? lote, TipoMovimiento tipo, int cant,
        decimal costoUnit, int saldo, decimal prom, string docTipo, string? docNum, string? concepto, string t) =>
        _db.MovimientosStock.Add(new MovimientoStock
        {
            ProductoId = prod,
            BodegaId = bod,
            LoteId = lote,
            Tipo = tipo,
            Cantidad = cant,
            CostoUnitario = costoUnit,
            SaldoCantidad = saldo,
            CostoPromedio = prom,
            Fecha = DateTime.UtcNow,
            DocumentoTipo = docTipo,
            DocumentoNumero = docNum,
            Concepto = concepto,
            TenantId = t,
        });

    private async Task<(int saldo, decimal promedio)?> EjecutarAsync(
        string sql, int productoId, string tenant, int cantidad, decimal costo)
    {
        var conn = _db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        var tx = _db.Database.CurrentTransaction;
        if (tx is not null) cmd.Transaction = tx.GetDbTransaction();
        cmd.CommandText = sql;
        cmd.Parameters.Add(new NpgsqlParameter("id", productoId));
        cmd.Parameters.Add(new NpgsqlParameter("t", tenant));
        cmd.Parameters.Add(new NpgsqlParameter("qty", cantidad));
        cmd.Parameters.Add(new NpgsqlParameter("cost", costo));
        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return (reader.GetInt32(0), reader.GetDecimal(1));
    }
}
