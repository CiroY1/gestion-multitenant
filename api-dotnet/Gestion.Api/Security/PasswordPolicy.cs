using System.Text.RegularExpressions;

namespace Gestion.Api.Security;

/// <summary>
/// Política de contraseñas del servidor (no se confía solo en el cliente):
/// mínimo de longitud y que incluya letras y números.
/// </summary>
public static class PasswordPolicy
{
    public const int MinLength = 8;

    public const string Mensaje =
        "La contraseña debe tener mínimo 8 caracteres e incluir letras y números.";

    public static bool EsValida(string? pwd)
    {
        var p = pwd ?? "";
        return p.Length >= MinLength
            && Regex.IsMatch(p, "[A-Za-z]")
            && Regex.IsMatch(p, "[0-9]");
    }
}
