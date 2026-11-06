using System.Security.Cryptography;
using System.Text;

namespace Gestion.Api.Security;

/// <summary>
/// Carga las llaves RSA para firmar/validar los JWT (RS256). Las llaves viven
/// como PEM en base64 en el entorno (.env.local, NUNCA en el repo). .NET firma
/// con la privada; Nest solo tiene la pública (no puede forjar tokens).
/// </summary>
public static class RsaKeys
{
    public static RSA LoadPrivate() => Load("JWT_PRIVATE_KEY_B64");
    public static RSA LoadPublic() => Load("JWT_PUBLIC_KEY_B64");

    private static RSA Load(string envVar)
    {
        var b64 = Environment.GetEnvironmentVariable(envVar)
            ?? throw new InvalidOperationException(
                $"Falta {envVar} en el entorno (.env.local). Genera el par de llaves RSA.");
        var pem = Encoding.UTF8.GetString(Convert.FromBase64String(b64));
        var rsa = RSA.Create();
        rsa.ImportFromPem(pem);
        return rsa;
    }
}
