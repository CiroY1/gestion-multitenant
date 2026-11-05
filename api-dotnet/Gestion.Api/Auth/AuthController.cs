using Gestion.Api.Data;
using Gestion.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Auth;

public record LoginDto(string Email, string Password);

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordService _pwd;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, PasswordService pwd, JwtService jwt)
    {
        _db = db;
        _pwd = pwd;
        _jwt = jwt;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var usuario = await _db.Usuarios
            .Include(u => u.Empresa)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (usuario is null || !_pwd.Verify(dto.Password, usuario.PasswordHash))
            return Unauthorized(new { mensaje = "Credenciales inválidas." });

        // Un usuario desactivado por el administrador no puede iniciar sesión.
        if (!usuario.Activo)
            return Unauthorized(new { mensaje = "Tu usuario está inactivo. Contacta a un administrador." });

        var (token, expira) = _jwt.CrearToken(usuario, usuario.Empresa!);

        return Ok(new
        {
            token,
            expira,
            usuario = new
            {
                usuario.Email,
                usuario.Rol,
                empresa = usuario.Empresa!.Nombre,
                tenantId = usuario.EmpresaId,
            },
            modulos = new
            {
                inventario = usuario.Empresa!.ModuloInventario,
                spa = usuario.Empresa!.ModuloSpa,
            },
        });
    }
}
