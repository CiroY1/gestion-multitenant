using Gestion.Api.Common;
using Gestion.Api.Data;
using Gestion.Api.Terceros.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Terceros;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProveedoresController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public ProveedoresController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProveedorDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Proveedores
            .Where(p => p.TenantId == t)
            .OrderBy(p => p.Nombre)
            .Select(p => new ProveedorDto(p.Id, p.Nombre, p.Nit, p.Telefono, p.Email))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProveedorDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var p = await _db.Proveedores.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        return p is null ? NotFound() : Ok(new ProveedorDto(p.Id, p.Nombre, p.Nit, p.Telefono, p.Email));
    }

    [HttpPost]
    public async Task<ActionResult<ProveedorDto>> Crear(GuardarProveedorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");
        var p = new Proveedor
        {
            Nombre = dto.Nombre.Trim(),
            Nit = dto.Nit,
            Telefono = dto.Telefono,
            Email = dto.Email,
            TenantId = _tenant.GetTenantId(),
        };
        _db.Proveedores.Add(p);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obtener), new { id = p.Id },
            new ProveedorDto(p.Id, p.Nombre, p.Nit, p.Telefono, p.Email));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, GuardarProveedorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");
        var t = _tenant.GetTenantId();
        var p = await _db.Proveedores.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (p is null) return NotFound();
        p.Nombre = dto.Nombre.Trim();
        p.Nit = dto.Nit;
        p.Telefono = dto.Telefono;
        p.Email = dto.Email;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var t = _tenant.GetTenantId();
        var p = await _db.Proveedores.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (p is null) return NotFound();
        _db.Proveedores.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
