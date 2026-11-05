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
public class MovimientosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly KardexService _kardex;

    public MovimientosController(AppDbContext db, ITenantProvider tenant, KardexService kardex)
    {
        _db = db;
        _tenant = tenant;
        _kardex = kardex;
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

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Movimiento manual al costo promedio vigente (entrada o salida), centralizado.
        var res = await _kardex.MoverAsync(producto.Id, t, dto.Tipo, dto.Cantidad,
            null, "MAN", null, "Movimiento manual");
        if (!res.Ok)
            return BadRequest($"Stock insuficiente. Disponible: {producto.Stock}.");

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new MovimientoDto(0, producto.Id, dto.Tipo.ToString(), dto.Cantidad, DateTime.UtcNow));
    }
}
