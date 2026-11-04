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
public class RemisionesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public RemisionesController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RemisionDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Remisiones
            .Where(r => r.TenantId == t)
            .OrderByDescending(r => r.Fecha)
            .Select(r => new RemisionDto(
                r.Id, r.Cliente, r.Observaciones, r.Fecha,
                r.Lineas.Sum(l => l.Cantidad),
                r.Lineas.Count))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RemisionDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Remisiones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();

        return Ok(new RemisionDetalleDto(
            r.Id, r.Cliente, r.Observaciones, r.Fecha,
            r.Lineas.Select(l => new RemisionLineaDto(
                l.ProductoId, l.Producto!.Nombre, l.Cantidad)).ToList()));
    }

    [HttpPost]
    public async Task<ActionResult<RemisionDetalleDto>> Crear(CrearRemisionDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Cliente))
            return BadRequest("El cliente es obligatorio.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("La remisión debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");

        // Precarga de productos del tenant (evita N+1 y valida existencia).
        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .ToDictionaryAsync(p => p.Id, p => p.Nombre);
        if (ids.Any(id => !productos.ContainsKey(id)))
            return BadRequest("Uno o más productos no existen.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        var remision = new Remision
        {
            Cliente = dto.Cliente,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            TenantId = t,
        };

        foreach (var l in dto.Lineas)
        {
            // Resta de stock atómica con guardia: si no hay suficiente, afecta 0 filas.
            var filas = await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" - {l.Cantidad}
                   WHERE ""Id"" = {l.ProductoId} AND ""TenantId"" = {t} AND ""Stock"" >= {l.Cantidad}");
            if (filas == 0)
                return BadRequest($"Stock insuficiente de \"{productos[l.ProductoId]}\".");

            remision.Lineas.Add(new RemisionLinea
            {
                ProductoId = l.ProductoId,
                Cantidad = l.Cantidad,
            });
            _db.MovimientosStock.Add(new MovimientoStock
            {
                ProductoId = l.ProductoId,
                Tipo = TipoMovimiento.Salida,
                Cantidad = l.Cantidad,
                Fecha = DateTime.UtcNow,
                TenantId = t,
            });
        }

        _db.Remisiones.Add(remision);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return CreatedAtAction(nameof(Obtener), new { id = remision.Id },
            new RemisionDetalleDto(
                remision.Id, remision.Cliente, remision.Observaciones, remision.Fecha,
                remision.Lineas.Select(l => new RemisionLineaDto(
                    l.ProductoId, null, l.Cantidad)).ToList()));
    }
}
