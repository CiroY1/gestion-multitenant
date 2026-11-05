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
public class OrdenesCompraController : ControllerBase
{
    private const string TipoDoc = "OC";

    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;

    public OrdenesCompraController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrdenCompraDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.OrdenesCompra
            .Where(o => o.TenantId == t)
            .OrderByDescending(o => o.Fecha)
            .Select(o => new OrdenCompraDto(
                o.Id, o.Numero, o.Proveedor, o.Observaciones, o.Fecha, o.Estado,
                o.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
                o.Lineas.Count,
                o.Lineas.Sum(l => l.Cantidad - l.CantidadRecibida)))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrdenCompraDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var o = await _db.OrdenesCompra
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (o is null) return NotFound();
        return Ok(Map(o));
    }

    [HttpPost]
    public async Task<ActionResult<OrdenCompraDetalleDto>> Crear(CrearOrdenCompraDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Proveedor))
            return BadRequest("El proveedor es obligatorio.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("La orden debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");
        if (dto.Lineas.Any(l => l.CostoUnitario < 0))
            return BadRequest("El costo unitario no puede ser negativo.");

        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id).ToListAsync();
        if (ids.Any(id => !productos.Contains(id)))
            return BadRequest("Uno o más productos no existen.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        var orden = new OrdenCompra
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            Proveedor = dto.Proveedor,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            Estado = EstadoOrden.Borrador,
            TenantId = t,
        };
        foreach (var l in dto.Lineas)
        {
            orden.Lineas.Add(new OrdenCompraLinea
            {
                ProductoId = l.ProductoId,
                Cantidad = l.Cantidad,
                CostoUnitario = l.CostoUnitario,
            });
        }

        _db.OrdenesCompra.Add(orden);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        var creada = await _db.OrdenesCompra
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstAsync(x => x.Id == orden.Id);
        return CreatedAtAction(nameof(Obtener), new { id = orden.Id }, Map(creada));
    }

    /// <summary>Aprueba un borrador: a partir de aquí se puede recibir contra la orden.</summary>
    [HttpPost("{id:int}/aprobar")]
    public async Task<ActionResult<OrdenCompraDetalleDto>> Aprobar(int id)
    {
        var o = await CargarAsync(id);
        if (o is null) return NotFound();
        if (o.Estado != EstadoOrden.Borrador)
            return BadRequest("Solo se puede aprobar una orden en borrador.");

        o.Estado = EstadoOrden.Aprobada;
        o.FechaAprobacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(Map(o));
    }

    /// <summary>Cierra la orden con el saldo pendiente (no se recibe más).</summary>
    [HttpPost("{id:int}/cerrar")]
    public async Task<ActionResult<OrdenCompraDetalleDto>> Cerrar(int id)
    {
        var o = await CargarAsync(id);
        if (o is null) return NotFound();
        if (o.Estado != EstadoOrden.Aprobada && o.Estado != EstadoOrden.Parcial)
            return BadRequest("Solo se puede cerrar una orden aprobada o parcial.");

        o.Estado = EstadoOrden.Cerrada;
        await _db.SaveChangesAsync();
        return Ok(Map(o));
    }

    /// <summary>Anula la orden. No se permite si ya tiene recepciones.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<OrdenCompraDetalleDto>> Anular(int id)
    {
        var o = await CargarAsync(id);
        if (o is null) return NotFound();
        if (o.Estado == EstadoOrden.Anulada)
            return BadRequest("La orden ya está anulada.");
        if (o.Lineas.Any(l => l.CantidadRecibida > 0))
            return BadRequest("No se puede anular: la orden ya tiene recepciones. Ciérrala en su lugar.");

        o.Estado = EstadoOrden.Anulada;
        await _db.SaveChangesAsync();
        return Ok(Map(o));
    }

    private Task<OrdenCompra?> CargarAsync(int id)
    {
        var t = _tenant.GetTenantId();
        return _db.OrdenesCompra
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
    }

    private static OrdenCompraDetalleDto Map(OrdenCompra o) => new(
        o.Id, o.Numero, o.Proveedor, o.Observaciones, o.Fecha, o.Estado,
        o.Lineas.Select(l => new OrdenLineaDto(
            l.Id, l.ProductoId, l.Producto?.Nombre, l.Cantidad, l.CostoUnitario,
            l.CantidadRecibida, l.Cantidad - l.CantidadRecibida)).ToList());
}
