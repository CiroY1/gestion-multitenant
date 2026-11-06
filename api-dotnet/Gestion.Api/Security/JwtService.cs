using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Gestion.Api.Auth;
using Microsoft.IdentityModel.Tokens;

namespace Gestion.Api.Security;

/// <summary>
/// Emite JWT firmados con HS256 usando JWT_SECRET (compartido por ambos backends).
/// El token NO lleva datos confidenciales, solo identidad y permisos.
/// </summary>
public class JwtService
{
    public const string Issuer = "gestion-api";
    public const string Audience = "gestion-clientes";
    private readonly SymmetricSecurityKey _key;

    public JwtService()
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
                     ?? throw new InvalidOperationException("Falta JWT_SECRET en el entorno.");
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    public SymmetricSecurityKey Key => _key;

    public (string token, DateTime expira) CrearToken(Usuario usuario, Empresa empresa)
    {
        var expira = DateTime.UtcNow.AddHours(2); // token de acceso corto

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new("tenantId", usuario.EmpresaId),
            new(ClaimTypes.Role, usuario.Rol),
            new("modInventario", empresa.ModuloInventario ? "1" : "0"),
            new("modSpa", empresa.ModuloSpa ? "1" : "0"),
            new("superAdmin", usuario.EsSuperAdmin ? "1" : "0"),
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: expira,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }
}
