using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Gestion.Api.Auth;
using Gestion.Api.Security;
using Xunit;

namespace Gestion.Api.Tests;

public class JwtServiceTests
{
    public JwtServiceTests()
    {
        // JwtService firma con la llave privada RSA del entorno; generamos una
        // llave de prueba y la ponemos en JWT_PRIVATE_KEY_B64 (PEM en base64).
        using var rsa = RSA.Create(2048);
        var pem = rsa.ExportPkcs8PrivateKeyPem();
        var b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(pem));
        Environment.SetEnvironmentVariable("JWT_PRIVATE_KEY_B64", b64);
    }

    [Fact]
    public void CrearToken_firma_RS256_y_lleva_los_claims()
    {
        var jwt = new JwtService();
        var empresa = new Empresa
        {
            Id = "demo",
            Nombre = "Empresa Demo",
            ModuloInventario = true,
            ModuloSpa = false,
        };
        var usuario = new Usuario
        {
            Id = 7,
            Email = "admin@demo.com",
            EmpresaId = "demo",
            Rol = "admin",
            EsSuperAdmin = true,
        };

        var (token, expira) = jwt.CrearToken(usuario, empresa);
        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Equal("RS256", parsed.Header.Alg);
        Assert.Equal(JwtService.Issuer, parsed.Issuer);
        Assert.Contains(parsed.Audiences, a => a == JwtService.Audience);
        Assert.Contains(parsed.Claims, c => c.Type == "tenantId" && c.Value == "demo");
        Assert.Contains(parsed.Claims, c => c.Type == "superAdmin" && c.Value == "1");
        Assert.Contains(parsed.Claims, c => c.Type == "modInventario" && c.Value == "1");
        Assert.Contains(parsed.Claims, c => c.Type == "modSpa" && c.Value == "0");
        Assert.True(expira > DateTime.UtcNow);
    }
}
