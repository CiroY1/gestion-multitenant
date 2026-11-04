using Gestion.Api.Common;
using Gestion.Api.Data;
using Gestion.Api.Inventario.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Inventario;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotasController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;

    public NotasController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotaDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Notas
            .Where(n => n.TenantId == t)
            .OrderByDescending(n => n.Fecha)
            .Select(n => new NotaDto(
                n.Id, n.Numero, n.Tipo,
                n.Remision != null ? n.Remision.Numero : (n.Recepcion != null ? n.Recepcion.Numero : null),
                n.Motivo, n.Fecha, n.Estado,
                n.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
                n.Lineas.Count))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NotaDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var n = await CargarAsync(id, t);
        if (n is null) return NotFound();
        return Ok(Map(n));
    }

    [HttpPost]
    public async Task<ActionResult<NotaDetalleDto>> Crear(CrearNotaDto dto)
    {
        var t = _tenant.GetTenantId();

        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("La nota debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");

        var nota = new Nota
        {
            Tipo = dto.Tipo,
            Motivo = dto.Motivo,
            Fecha = DateTime.UtcNow,
            Estado = EstadoDocumento.Borrador,
            TenantId = t,
        };

        if (dto.Tipo == TipoNota.Credito)
        {
            var rem = await _db.Remisiones
                .Include(x => x.Lineas).ThenInclude(l => l.Producto)
                .FirstOrDefaultAsync(x => x.Id == dto.DocumentoOrigenId && x.TenantId == t);
            if (rem is null) return BadRequest("La remisión origen no existe.");
            if (rem.Estado != EstadoDocumento.Confirmado)
                return BadRequest("Solo se puede hacer una devolución sobre una remisión confirmada.");

            foreach (var l in dto.Lineas)
            {
                var orig = rem.Lineas.FirstOrDefault(x => x.ProductoId == l.ProductoId);
                if (orig is null)
                    return BadRequest("Un producto no pertenece a la remisión origen.");
                if (l.Cantidad > orig.Cantidad)
                    return BadRequest($"No puedes devolver más de lo despachado de \"{orig.Producto?.Nombre}\".");

                nota.Lineas.Add(new NotaLinea
                {
                    ProductoId = l.ProductoId,
                    Cantidad = l.Cantidad,
                    CostoUnitario = orig.Producto?.Precio ?? 0m,
                });
            }
            nota.RemisionId = rem.Id;
        }
        else
        {
            var rec = await _db.Recepciones
                .Include(x => x.Lineas).ThenInclude(l => l.Producto)
                .FirstOrDefaultAsync(x => x.Id == dto.DocumentoOrigenId && x.TenantId == t);
            if (rec is null) return BadRequest("La recepción origen no existe.");
            if (rec.Estado != EstadoDocumento.Confirmado)
                return BadRequest("Solo se puede hacer una devolución sobre una recepción confirmada.");

            foreach (var l in dto.Lineas)
            {
                var orig = rec.Lineas.FirstOrDefault(x => x.ProductoId == l.ProductoId);
                if (orig is null)
                    return BadRequest("Un producto no pertenece a la recepción origen.");
                if (l.Cantidad > orig.Cantidad)
                    return BadRequest($"No puedes devolver más de lo recibido de \"{orig.Producto?.Nombre}\".");

                nota.Lineas.Add(new NotaLinea
                {
                    ProductoId = l.ProductoId,
                    Cantidad = l.Cantidad,
                    CostoUnitario = orig.CostoUnitario,
                });
            }
            nota.RecepcionId = rec.Id;
        }

        await using var tx = await _db.Database.BeginTransactionAsync();
        nota.Numero = await _consecutivos.SiguienteAsync(t, dto.Tipo == TipoNota.Credito ? "NC" : "ND");
        _db.Notas.Add(nota);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        var creada = await CargarAsync(nota.Id, t);
        return CreatedAtAction(nameof(Obtener), new { id = nota.Id }, Map(creada!));
    }

    /// <summary>Confirma la nota: aplica el movimiento de stock (crédito suma, débito resta).</summary>
    [HttpPost("{id:int}/confirmar")]
    public async Task<ActionResult<NotaDetalleDto>> Confirmar(int id)
    {
        var t = _tenant.GetTenantId();
        var n = await CargarAsync(id, t);
        if (n is null) return NotFound();
        if (n.Estado != EstadoDocumento.Borrador)
            return BadRequest("Solo se puede confirmar una nota en borrador.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var l in n.Lineas)
        {
            if (n.Tipo == TipoNota.Credito)
            {
                // Devolución de cliente: la mercancía regresa (suma stock).
                await AjustarStockAsync(l.ProductoId, t, +l.Cantidad);
                RegistrarMovimiento(l.ProductoId, TipoMovimiento.Entrada, l.Cantidad, t);
            }
            else
            {
                // Devolución a proveedor: la mercancía sale (resta stock, con guardia).
                if (!await AjustarStockAsync(l.ProductoId, t, -l.Cantidad))
                {
                    await tx.RollbackAsync();
                    return BadRequest($"Stock insuficiente de \"{l.Producto?.Nombre ?? $"#{l.ProductoId}"}\".");
                }
                RegistrarMovimiento(l.ProductoId, TipoMovimiento.Salida, l.Cantidad, t);
            }
        }

        n.Estado = EstadoDocumento.Confirmado;
        n.FechaConfirmacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(Map(n));
    }

    /// <summary>Anula la nota. Si estaba confirmada, revierte el movimiento de stock.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<NotaDetalleDto>> Anular(int id)
    {
        var t = _tenant.GetTenantId();
        var n = await CargarAsync(id, t);
        if (n is null) return NotFound();
        if (n.Estado == EstadoDocumento.Anulado)
            return BadRequest("La nota ya está anulada.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        if (n.Estado == EstadoDocumento.Confirmado)
        {
            foreach (var l in n.Lineas)
            {
                if (n.Tipo == TipoNota.Credito)
                {
                    // Revertir la entrada: vuelve a salir (con guardia).
                    if (!await AjustarStockAsync(l.ProductoId, t, -l.Cantidad))
                    {
                        await tx.RollbackAsync();
                        return BadRequest($"No se puede anular: el stock de \"{l.Producto?.Nombre ?? $"#{l.ProductoId}"}\" ya fue despachado.");
                    }
                    RegistrarMovimiento(l.ProductoId, TipoMovimiento.Salida, l.Cantidad, t);
                }
                else
                {
                    // Revertir la salida: vuelve a entrar.
                    await AjustarStockAsync(l.ProductoId, t, +l.Cantidad);
                    RegistrarMovimiento(l.ProductoId, TipoMovimiento.Entrada, l.Cantidad, t);
                }
            }
        }

        n.Estado = EstadoDocumento.Anulado;
        n.FechaAnulacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(Map(n));
    }

    // --- Helpers ---

    private Task<Nota?> CargarAsync(int id, string t) => _db.Notas
        .Include(n => n.Remision)
        .Include(n => n.Recepcion)
        .Include(n => n.Lineas).ThenInclude(l => l.Producto)
        .FirstOrDefaultAsync(n => n.Id == id && n.TenantId == t);

    /// <summary>
    /// Ajuste atómico de stock. Con delta negativo aplica la guardia de stock
    /// suficiente y devuelve false si no alcanza (0 filas afectadas).
    /// </summary>
    private async Task<bool> AjustarStockAsync(int productoId, string t, int delta)
    {
        if (delta >= 0)
        {
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" + {delta}
                   WHERE ""Id"" = {productoId} AND ""TenantId"" = {t}");
            return true;
        }

        var faltante = -delta;
        var filas = await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" - {faltante}
               WHERE ""Id"" = {productoId} AND ""TenantId"" = {t} AND ""Stock"" >= {faltante}");
        return filas > 0;
    }

    private void RegistrarMovimiento(int productoId, TipoMovimiento tipo, int cantidad, string t) =>
        _db.MovimientosStock.Add(new MovimientoStock
        {
            ProductoId = productoId,
            Tipo = tipo,
            Cantidad = cantidad,
            Fecha = DateTime.UtcNow,
            TenantId = t,
        });

    private static NotaDetalleDto Map(Nota n) => new(
        n.Id, n.Numero, n.Tipo,
        n.Remision?.Numero ?? n.Recepcion?.Numero,
        n.Motivo, n.Fecha, n.Estado,
        n.Lineas.Select(l => new NotaLineaDto(
            l.ProductoId, l.Producto?.Nombre, l.Cantidad, l.CostoUnitario)).ToList());
}
