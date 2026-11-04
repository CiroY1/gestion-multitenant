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
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public RecepcionesController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecepcionDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Recepciones
            .Where(r => r.TenantId == t)
            .OrderByDescending(r => r.Fecha)
            .Select(r => new RecepcionDto(
                r.Id, r.Proveedor, r.Observaciones, r.Fecha,
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

        return Ok(new RecepcionDetalleDto(
            r.Id, r.Proveedor, r.Observaciones, r.Fecha,
            r.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
            r.Lineas.Select(l => new RecepcionLineaDto(
                l.ProductoId, l.Producto!.Nombre, l.Cantidad, l.CostoUnitario)).ToList()));
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

        var recepcion = new Recepcion
        {
            Proveedor = dto.Proveedor,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
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

            // Suma de stock atómica.
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" + {l.Cantidad}
                   WHERE ""Id"" = {l.ProductoId} AND ""TenantId"" = {t}");

            _db.MovimientosStock.Add(new MovimientoStock
            {
                ProductoId = l.ProductoId,
                Tipo = TipoMovimiento.Entrada,
                Cantidad = l.Cantidad,
                Fecha = DateTime.UtcNow,
                TenantId = t,
            });
        }

        _db.Recepciones.Add(recepcion);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return CreatedAtAction(nameof(Obtener), new { id = recepcion.Id },
            new RecepcionDetalleDto(
                recepcion.Id, recepcion.Proveedor, recepcion.Observaciones, recepcion.Fecha,
                recepcion.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
                recepcion.Lineas.Select(l => new RecepcionLineaDto(
                    l.ProductoId, null, l.Cantidad, l.CostoUnitario)).ToList()));
    }
}
