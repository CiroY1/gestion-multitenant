using System.Security.Claims;
using Gestion.Api.Common;
using Gestion.Api.Data;
using Gestion.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Auth;

public record CrearUsuarioDto(string Email, string Password, string Rol);
public record ActualizarUsuarioDto(string Rol, bool Activo);
public record PasswordDto(string Password);

/// <summary>
/// Gestión de usuarios de la empresa. SOLO administradores (se exige el rol
/// "admin" del token). Todas las consultas se limitan al tenant actual.
/// </summary>
[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "admin")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordService _pwd;
    private readonly ITenantProvider _tenant;

    public UsuariosController(AppDbContext db, PasswordService pwd, ITenantProvider tenant)
    {
        _db = db;
        _pwd = pwd;
        _tenant = tenant;
    }

    private string Tenant => _tenant.GetTenantId();

    private int? CurrentUserId =>
        int.TryParse(
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value,
            out var id)
            ? id
            : null;

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var items = await _db.Usuarios
            .Where(u => u.EmpresaId == Tenant)
            .OrderBy(u => u.Email)
            .Select(u => new { u.Id, u.Email, u.Rol, u.Activo })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearUsuarioDto dto)
    {
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
            EmpresaId = Tenant,
            Activo = true,
        };
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return Ok(new { usuario.Id, ok = true });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, ActualizarUsuarioDto dto)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.EmpresaId == Tenant);
        if (usuario is null) return NotFound();

        var rol = NormalizarRol(dto.Rol);
        // El admin no puede quitarse a sí mismo el acceso (evita quedar bloqueado).
        if (id == CurrentUserId && (!dto.Activo || rol != "admin"))
            return BadRequest("No puedes quitarte a ti mismo el acceso de administrador.");

        usuario.Rol = rol;
        usuario.Activo = dto.Activo;
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    [HttpPost("{id:int}/password")]
    public async Task<IActionResult> ResetPassword(int id, PasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest("La contraseña debe tener al menos 6 caracteres.");

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.EmpresaId == Tenant);
        if (usuario is null) return NotFound();

        usuario.PasswordHash = _pwd.Hash(dto.Password);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (id == CurrentUserId)
            return BadRequest("No puedes eliminar tu propio usuario.");

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.EmpresaId == Tenant);
        if (usuario is null) return NotFound();

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
