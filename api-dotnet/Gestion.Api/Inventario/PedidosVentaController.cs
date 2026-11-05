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
public class PedidosVentaController : ControllerBase
{
    private const string TipoDoc = "PV";

    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;

    public PedidosVentaController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PedidoVentaDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.PedidosVenta
            .Where(p => p.TenantId == t)
            .OrderByDescending(p => p.Fecha)
            .Select(p => new PedidoVentaDto(
                p.Id, p.Numero, p.Cliente, p.Observaciones, p.Fecha, p.Estado,
                p.Lineas.Sum(l => l.Cantidad * l.PrecioUnitario),
                p.Lineas.Count,
                p.Lineas.Sum(l => l.Cantidad - l.CantidadDespachada)))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PedidoVentaDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var p = await _db.PedidosVenta
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (p is null) return NotFound();
        return Ok(Map(p));
    }

    [HttpPost]
    public async Task<ActionResult<PedidoVentaDetalleDto>> Crear(CrearPedidoVentaDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Cliente))
            return BadRequest("El cliente es obligatorio.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("El pedido debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");
        if (dto.Lineas.Any(l => l.PrecioUnitario < 0))
            return BadRequest("El precio unitario no puede ser negativo.");

        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id).ToListAsync();
        if (ids.Any(id => !productos.Contains(id)))
            return BadRequest("Uno o más productos no existen.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        var pedido = new PedidoVenta
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            Cliente = dto.Cliente,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            Estado = EstadoPedido.Borrador,
            TenantId = t,
        };
        foreach (var l in dto.Lineas)
        {
            pedido.Lineas.Add(new PedidoVentaLinea
            {
                ProductoId = l.ProductoId,
                Cantidad = l.Cantidad,
                PrecioUnitario = l.PrecioUnitario,
            });
        }

        _db.PedidosVenta.Add(pedido);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        var creado = await _db.PedidosVenta
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstAsync(x => x.Id == pedido.Id);
        return CreatedAtAction(nameof(Obtener), new { id = pedido.Id }, Map(creado));
    }

    /// <summary>Aprueba un borrador: a partir de aquí se puede despachar contra el pedido.</summary>
    [HttpPost("{id:int}/aprobar")]
    public async Task<ActionResult<PedidoVentaDetalleDto>> Aprobar(int id)
    {
        var p = await CargarAsync(id);
        if (p is null) return NotFound();
        if (p.Estado != EstadoPedido.Borrador)
            return BadRequest("Solo se puede aprobar un pedido en borrador.");

        p.Estado = EstadoPedido.Aprobado;
        p.FechaAprobacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(Map(p));
    }

    /// <summary>Cierra el pedido con el saldo pendiente (no se despacha más).</summary>
    [HttpPost("{id:int}/cerrar")]
    public async Task<ActionResult<PedidoVentaDetalleDto>> Cerrar(int id)
    {
        var p = await CargarAsync(id);
        if (p is null) return NotFound();
        if (p.Estado != EstadoPedido.Aprobado && p.Estado != EstadoPedido.Parcial)
            return BadRequest("Solo se puede cerrar un pedido aprobado o parcial.");

        p.Estado = EstadoPedido.Cerrado;
        await _db.SaveChangesAsync();
        return Ok(Map(p));
    }

    /// <summary>Anula el pedido. No se permite si ya tiene remisiones.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<PedidoVentaDetalleDto>> Anular(int id)
    {
        var p = await CargarAsync(id);
        if (p is null) return NotFound();
        if (p.Estado == EstadoPedido.Anulado)
            return BadRequest("El pedido ya está anulado.");
        if (p.Lineas.Any(l => l.CantidadDespachada > 0))
            return BadRequest("No se puede anular: el pedido ya tiene remisiones. Ciérralo en su lugar.");

        p.Estado = EstadoPedido.Anulado;
        await _db.SaveChangesAsync();
        return Ok(Map(p));
    }

    private Task<PedidoVenta?> CargarAsync(int id)
    {
        var t = _tenant.GetTenantId();
        return _db.PedidosVenta
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
    }

    private static PedidoVentaDetalleDto Map(PedidoVenta p) => new(
        p.Id, p.Numero, p.Cliente, p.Observaciones, p.Fecha, p.Estado,
        p.Lineas.Select(l => new PedidoLineaDto(
            l.Id, l.ProductoId, l.Producto?.Nombre, l.Cantidad, l.PrecioUnitario,
            l.CantidadDespachada, l.Cantidad - l.CantidadDespachada)).ToList());
}
