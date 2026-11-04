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
public class CategoriasController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public CategoriasController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoriaDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Categorias
            .Where(c => c.TenantId == t)
            .OrderBy(c => c.Nombre)
            .Select(c => new CategoriaDto(c.Id, c.Nombre))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoriaDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var c = await _db.Categorias.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        return c is null ? NotFound() : Ok(new CategoriaDto(c.Id, c.Nombre));
    }

    [HttpPost]
    public async Task<ActionResult<CategoriaDto>> Crear(GuardarCategoriaDto dto)
    {
        var categoria = new Categoria { Nombre = dto.Nombre, TenantId = _tenant.GetTenantId() };
        _db.Categorias.Add(categoria);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obtener), new { id = categoria.Id },
            new CategoriaDto(categoria.Id, categoria.Nombre));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, GuardarCategoriaDto dto)
    {
        var t = _tenant.GetTenantId();
        var c = await _db.Categorias.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (c is null) return NotFound();
        c.Nombre = dto.Nombre;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var t = _tenant.GetTenantId();
        var c = await _db.Categorias.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (c is null) return NotFound();
        _db.Categorias.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
