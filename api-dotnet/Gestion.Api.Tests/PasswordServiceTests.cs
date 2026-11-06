using Gestion.Api.Security;
using Xunit;

namespace Gestion.Api.Tests;

public class PasswordServiceTests
{
    private readonly PasswordService _pwd = new();

    [Fact]
    public void Hash_no_devuelve_la_contrasena_en_texto_plano()
    {
        var hash = _pwd.Hash("Secreto123");
        Assert.NotEqual("Secreto123", hash);
        Assert.StartsWith("$2", hash); // prefijo BCrypt
    }

    [Fact]
    public void Verify_true_para_la_correcta_y_false_para_otra()
    {
        var hash = _pwd.Hash("Secreto123");
        Assert.True(_pwd.Verify("Secreto123", hash));
        Assert.False(_pwd.Verify("incorrecta", hash));
    }

    [Fact]
    public void Dos_hashes_de_la_misma_clave_son_distintos_por_el_salt()
    {
        Assert.NotEqual(_pwd.Hash("Secreto123"), _pwd.Hash("Secreto123"));
    }
}
