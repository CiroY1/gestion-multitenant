using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Gestion.Api.Auth;

namespace Gestion.Api.Security;

/// <summary>
/// Emite JWT firmados con RS256: .NET firma con la llave privada RSA y Nest
/// valida solo con la pública (no puede forjar tokens). El token NO lleva datos
/// confidenciales, solo identidad y permisos.
/// </summary>
public class JwtService
{
    public const string Issuer = "gestion-api";
    public const string Audience = "gestion-clientes";
    private readonly RsaSecurityKey _key;

    public JwtService()
    {
        _key = new RsaSecurityKey(RsaKeys.LoadPrivate());
    }

    public RsaSecurityKey Key => _key;

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

        var creds = new SigningCredentials(_key, SecurityAlgorithms.RsaSha256);
        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: expira,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }
}
