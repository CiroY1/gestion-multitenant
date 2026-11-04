using Gestion.Api.Common;
using Gestion.Api.Data;
using Gestion.Api.Inventario.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Inventario;

[ApiController]
[Route("api/[controller]")]
public class MovimientosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public MovimientosController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MovimientoDto>>> Listar([FromQuery] int? productoId)
    {
        var t = _tenant.GetTenantId();
        var query = _db.MovimientosStock.Where(m => m.TenantId == t);
        if (productoId is not null)
            query = query.Where(m => m.ProductoId == productoId);

        var items = await query
            .OrderByDescending(m => m.Fecha)
            .Select(m => new MovimientoDto(m.Id, m.ProductoId, m.Tipo.ToString(), m.Cantidad, m.Fecha))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<MovimientoDto>> Registrar(CrearMovimientoDto dto)
    {
        var t = _tenant.GetTenantId();
        if (dto.Cantidad <= 0) return BadRequest("La cantidad debe ser mayor a 0.");

        var producto = await _db.Productos
            .FirstOrDefaultAsync(p => p.Id == dto.ProductoId && p.TenantId == t);
        if (producto is null) return NotFound("El producto no existe.");

        if (dto.Tipo == TipoMovimiento.Salida && producto.Stock < dto.Cantidad)
            return BadRequest($"Stock insuficiente. Disponible: {producto.Stock}.");

        // Actualiza el stock del producto según el tipo de movimiento.
        producto.Stock += dto.Tipo == TipoMovimiento.Entrada ? dto.Cantidad : -dto.Cantidad;

        var movimiento = new MovimientoStock
        {
            ProductoId = producto.Id,
            Tipo = dto.Tipo,
            Cantidad = dto.Cantidad,
            Fecha = DateTime.UtcNow,
            TenantId = t
        };
        _db.MovimientosStock.Add(movimiento);
        await _db.SaveChangesAsync();

        return Ok(new MovimientoDto(movimiento.Id, movimiento.ProductoId,
            movimiento.Tipo.ToString(), movimiento.Cantidad, movimiento.Fecha));
    }
}
