namespace Gestion.Api.Security;

/// <summary>
/// Hashea y verifica contraseñas con BCrypt. El hash es de una sola vía:
/// ni nosotros podemos recuperar la contraseña original.
/// </summary>
public class PasswordService
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
