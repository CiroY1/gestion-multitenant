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
public class RecepcionesController : ControllerBase
{
    private const string TipoDoc = "REC";

    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;
    private readonly KardexService _kardex;

    public RecepcionesController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos, KardexService kardex)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
        _kardex = kardex;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecepcionDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Recepciones
            .Where(r => r.TenantId == t)
            .OrderByDescending(r => r.Fecha)
            .Select(r => new RecepcionDto(
                r.Id, r.Numero, r.Proveedor, r.Observaciones, r.Fecha, r.Estado,
                r.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
                r.Lineas.Count))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecepcionDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recepciones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();

        return Ok(ToDetalle(r));
    }

    [HttpPost]
    public async Task<ActionResult<RecepcionDetalleDto>> Crear(CrearRecepcionDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Proveedor))
            return BadRequest("El proveedor es obligatorio.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("La recepción debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");
        if (dto.Lineas.Any(l => l.CostoUnitario < 0))
            return BadRequest("El costo unitario no puede ser negativo.");

        // Precarga de productos del tenant (evita N+1 y valida existencia).
        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id)
            .ToListAsync();
        if (ids.Any(id => !productos.Contains(id)))
            return BadRequest("Uno o más productos no existen.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Se crea como BORRADOR: no se mueve stock hasta confirmar.
        var recepcion = new Recepcion
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            Proveedor = dto.Proveedor,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            Estado = EstadoDocumento.Borrador,
            TenantId = t,
        };

        foreach (var l in dto.Lineas)
        {
            recepcion.Lineas.Add(new RecepcionLinea
            {
                ProductoId = l.ProductoId,
                Cantidad = l.Cantidad,
                CostoUnitario = l.CostoUnitario,
            });
        }

        _db.Recepciones.Add(recepcion);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return CreatedAtAction(nameof(Obtener), new { id = recepcion.Id }, ToDetalle(recepcion));
    }

    /// <summary>Confirma un borrador: suma el stock y genera los movimientos de entrada.</summary>
    [HttpPost("{id:int}/confirmar")]
    public async Task<ActionResult<RecepcionDetalleDto>> Confirmar(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recepciones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();
        if (r.Estado != EstadoDocumento.Borrador)
            return BadRequest("Solo se puede confirmar una recepción en borrador.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var l in r.Lineas)
        {
            // Entrada con costo de compra: actualiza el costo promedio del producto.
            await _kardex.MoverAsync(l.ProductoId, t, TipoMovimiento.Entrada, l.Cantidad,
                l.CostoUnitario, "REC", r.Numero, "Recepción de mercancía");
        }

        r.Estado = EstadoDocumento.Confirmado;
        r.FechaConfirmacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDetalle(r));
    }

    /// <summary>Anula la recepción. Si estaba confirmada, revierte el stock sumado.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<RecepcionDetalleDto>> Anular(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recepciones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();
        if (r.Estado == EstadoDocumento.Anulado)
            return BadRequest("La recepción ya está anulada.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Si estaba confirmada, revertir el stock que había sumado.
        if (r.Estado == EstadoDocumento.Confirmado)
        {
            foreach (var l in r.Lineas)
            {
                // Revertir la entrada: salida al costo promedio, con guardia de stock.
                var res = await _kardex.MoverAsync(l.ProductoId, t, TipoMovimiento.Salida, l.Cantidad,
                    null, "REC", r.Numero, "Anulación de recepción");
                if (!res.Ok)
                {
                    await tx.RollbackAsync();
                    var nombre = l.Producto?.Nombre ?? $"#{l.ProductoId}";
                    return BadRequest($"No se puede anular: el stock de \"{nombre}\" ya fue despachado.");
                }
            }
        }

        r.Estado = EstadoDocumento.Anulado;
        r.FechaAnulacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDetalle(r));
    }

    private static RecepcionDetalleDto ToDetalle(Recepcion r) => new(
        r.Id, r.Numero, r.Proveedor, r.Observaciones, r.Fecha, r.Estado,
        r.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
        r.Lineas.Select(l => new RecepcionLineaDto(
            l.ProductoId, l.Producto?.Nombre, l.Cantidad, l.CostoUnitario)).ToList());
}
