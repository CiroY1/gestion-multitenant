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
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public ClientesController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Clientes
            .Where(c => c.TenantId == t)
            .OrderBy(c => c.Nombre)
            .Select(c => new ClienteDto(c.Id, c.Nombre, c.Documento, c.Telefono, c.Email))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var c = await _db.Clientes.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        return c is null ? NotFound() : Ok(new ClienteDto(c.Id, c.Nombre, c.Documento, c.Telefono, c.Email));
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Crear(GuardarClienteDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");
        var c = new Cliente
        {
            Nombre = dto.Nombre.Trim(),
            Documento = dto.Documento,
            Telefono = dto.Telefono,
            Email = dto.Email,
            TenantId = _tenant.GetTenantId(),
        };
        _db.Clientes.Add(c);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obtener), new { id = c.Id },
            new ClienteDto(c.Id, c.Nombre, c.Documento, c.Telefono, c.Email));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, GuardarClienteDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return BadRequest("El nombre es obligatorio.");
        var t = _tenant.GetTenantId();
        var c = await _db.Clientes.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (c is null) return NotFound();
        c.Nombre = dto.Nombre.Trim();
        c.Documento = dto.Documento;
        c.Telefono = dto.Telefono;
        c.Email = dto.Email;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var t = _tenant.GetTenantId();
        var c = await _db.Clientes.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (c is null) return NotFound();
        _db.Clientes.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
