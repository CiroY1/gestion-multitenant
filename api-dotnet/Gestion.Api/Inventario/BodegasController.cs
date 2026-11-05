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
public class BodegasController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public BodegasController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BodegaDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Bodegas
            .Where(b => b.TenantId == t)
            .OrderBy(b => b.Nombre)
            .Select(b => new BodegaDto(b.Id, b.Nombre, b.Codigo, b.Activa))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<BodegaDto>> Crear(GuardarBodegaDto dto)
    {
        var t = _tenant.GetTenantId();
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest("El nombre es obligatorio.");

        var b = new Bodega
        {
            Nombre = dto.Nombre.Trim(),
            Codigo = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim(),
            Activa = dto.Activa,
            TenantId = t,
        };
        _db.Bodegas.Add(b);
        await _db.SaveChangesAsync();
        return Ok(new BodegaDto(b.Id, b.Nombre, b.Codigo, b.Activa));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, GuardarBodegaDto dto)
    {
        var t = _tenant.GetTenantId();
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest("El nombre es obligatorio.");

        var b = await _db.Bodegas.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (b is null) return NotFound();

        b.Nombre = dto.Nombre.Trim();
        b.Codigo = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim();
        b.Activa = dto.Activa;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Existencias (stock por producto y bodega), con filtros opcionales.</summary>
    [HttpGet("existencias")]
    public async Task<ActionResult<IEnumerable<ExistenciaDto>>> Existencias(
        [FromQuery] int? bodegaId, [FromQuery] int? productoId)
    {
        var t = _tenant.GetTenantId();
        var q = _db.ExistenciaBodegas.Where(e => e.TenantId == t);
        if (bodegaId is not null) q = q.Where(e => e.BodegaId == bodegaId);
        if (productoId is not null) q = q.Where(e => e.ProductoId == productoId);

        var items = await q
            .OrderBy(e => e.Producto!.Nombre).ThenBy(e => e.Bodega!.Nombre)
            .Select(e => new ExistenciaDto(
                e.ProductoId, e.Producto!.Nombre, e.BodegaId, e.Bodega!.Nombre, e.Stock))
            .ToListAsync();
        return Ok(items);
    }
}
