using Gestion.Api.Data;
using Gestion.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Auth;

public record CrearEmpresaDto(
    string Id, string Nombre, bool ModuloInventario, bool ModuloSpa,
    string? LogoUrl = null, string? Direccion = null, string? Telefono = null,
    string? Email = null, string? SitioWeb = null, string? Nit = null,
    string? RazonSocial = null);

public record ActualizarEmpresaDto(
    string Nombre, bool ModuloInventario, bool ModuloSpa,
    string? LogoUrl = null, string? Direccion = null, string? Telefono = null,
    string? Email = null, string? SitioWeb = null, string? Nit = null,
    string? RazonSocial = null);

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
    private readonly PasswordService _pwd;

    public EmpresasController(AppDbContext db, PasswordService pwd)
    {
        _db = db;
        _pwd = pwd;
    }

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
                e.LogoUrl,
                e.Direccion,
                e.Telefono,
                e.Email,
                e.SitioWeb,
                e.Nit,
                e.RazonSocial,
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
            LogoUrl = Limpiar(dto.LogoUrl),
            Direccion = Limpiar(dto.Direccion),
            Telefono = Limpiar(dto.Telefono),
            Email = Limpiar(dto.Email),
            SitioWeb = Limpiar(dto.SitioWeb),
            Nit = Limpiar(dto.Nit),
            RazonSocial = Limpiar(dto.RazonSocial),
        });
        await _db.SaveChangesAsync();

        // Aprovisiona el schema de la nueva empresa al instante (sin reiniciar
        // los backends): crea t_<id> con las tablas de negocio y spa.
        await Gestion.Api.Data.TenantSchemas.ProvisionarAsync(
            _db.Database.GetConnectionString()!, id);

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
        empresa.LogoUrl = Limpiar(dto.LogoUrl);
        empresa.Direccion = Limpiar(dto.Direccion);
        empresa.Telefono = Limpiar(dto.Telefono);
        empresa.Email = Limpiar(dto.Email);
        empresa.SitioWeb = Limpiar(dto.SitioWeb);
        empresa.Nit = Limpiar(dto.Nit);
        empresa.RazonSocial = Limpiar(dto.RazonSocial);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    /// <summary>Recorta y convierte vacío en null, para no guardar cadenas en blanco.</summary>
    private static string? Limpiar(string? valor)
    {
        var v = (valor ?? "").Trim();
        return string.IsNullOrEmpty(v) ? null : v;
    }

    // ---- Usuarios de una empresa (el super-admin entra a la empresa y los gestiona) ----

    [HttpGet("{id}/usuarios")]
    public async Task<IActionResult> ListarUsuarios(string id)
    {
        if (!await _db.Empresas.AnyAsync(e => e.Id == id)) return NotFound();
        var items = await _db.Usuarios
            .Where(u => u.EmpresaId == id)
            .OrderBy(u => u.Email)
            .Select(u => new { u.Id, u.Email, u.Rol, u.Activo, u.EsSuperAdmin })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("{id}/usuarios")]
    public async Task<IActionResult> CrearUsuario(string id, CrearUsuarioDto dto)
    {
        if (!await _db.Empresas.AnyAsync(e => e.Id == id)) return NotFound();

        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("El email es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest("La contraseña debe tener al menos 6 caracteres.");
        if (await _db.Usuarios.AnyAsync(u => u.Email == email))
            return BadRequest("Ya existe un usuario con ese email.");

        var usuario = new Usuario
        {
            Email = email,
            PasswordHash = _pwd.Hash(dto.Password),
            Rol = NormalizarRol(dto.Rol),
            EmpresaId = id,
            Activo = true,
        };
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return Ok(new { usuario.Id, ok = true });
    }

    [HttpPut("{id}/usuarios/{uid:int}")]
    public async Task<IActionResult> ActualizarUsuario(string id, int uid, ActualizarUsuarioDto dto)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == uid && u.EmpresaId == id);
        if (usuario is null) return NotFound();
        if (usuario.EsSuperAdmin)
            return BadRequest("No se puede modificar un super-admin desde aquí.");

        usuario.Rol = NormalizarRol(dto.Rol);
        usuario.Activo = dto.Activo;
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    [HttpPost("{id}/usuarios/{uid:int}/password")]
    public async Task<IActionResult> ResetPassword(string id, int uid, PasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest("La contraseña debe tener al menos 6 caracteres.");

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == uid && u.EmpresaId == id);
        if (usuario is null) return NotFound();

        usuario.PasswordHash = _pwd.Hash(dto.Password);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    [HttpDelete("{id}/usuarios/{uid:int}")]
    public async Task<IActionResult> EliminarUsuario(string id, int uid)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == uid && u.EmpresaId == id);
        if (usuario is null) return NotFound();
        if (usuario.EsSuperAdmin)
            return BadRequest("No se puede eliminar un super-admin desde aquí.");

        _db.Usuarios.Remove(usuario);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    /// <summary>Solo se permiten dos roles: admin u operador.</summary>
    private static string NormalizarRol(string? rol)
    {
        var r = (rol ?? "").Trim().ToLowerInvariant();
        return r == "admin" ? "admin" : "operador";
    }
}
