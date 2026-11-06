using Gestion.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Auth;

public record CrearEmpresaDto(string Id, string Nombre, bool ModuloInventario, bool ModuloSpa);
public record ActualizarEmpresaDto(string Nombre, bool ModuloInventario, bool ModuloSpa);

/// <summary>
/// Gestión de empresas (tenants) y sus módulos. SOLO super-admin de plataforma.
/// Opera entre todas las empresas (no se filtra por tenant).
/// </summary>
[ApiController]
[Route("api/empresas")]
[Authorize(Policy = "SuperAdmin")]
public class EmpresasController : ControllerBase
{
    private readonly AppDbContext _db;

    public EmpresasController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var items = await _db.Empresas
            .OrderBy(e => e.Nombre)
            .Select(e => new
            {
                e.Id,
                e.Nombre,
                e.ModuloInventario,
                e.ModuloSpa,
                usuarios = _db.Usuarios.Count(u => u.EmpresaId == e.Id),
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearEmpresaDto dto)
    {
        var id = (dto.Id ?? "").Trim().ToLowerInvariant();
        var nombre = (dto.Nombre ?? "").Trim();
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest("El identificador es obligatorio.");
        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest("El nombre es obligatorio.");
        if (await _db.Empresas.AnyAsync(e => e.Id == id))
            return BadRequest("Ya existe una empresa con ese identificador.");

        _db.Empresas.Add(new Empresa
        {
            Id = id,
            Nombre = nombre,
            ModuloInventario = dto.ModuloInventario,
            ModuloSpa = dto.ModuloSpa,
        });
        await _db.SaveChangesAsync();
        return Ok(new { id, ok = true });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(string id, ActualizarEmpresaDto dto)
    {
        var empresa = await _db.Empresas.FirstOrDefaultAsync(e => e.Id == id);
        if (empresa is null) return NotFound();

        var nombre = (dto.Nombre ?? "").Trim();
        if (!string.IsNullOrWhiteSpace(nombre)) empresa.Nombre = nombre;
        empresa.ModuloInventario = dto.ModuloInventario;
        empresa.ModuloSpa = dto.ModuloSpa;
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }
}
