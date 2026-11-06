using Gestion.Api.Security;
using Xunit;

namespace Gestion.Api.Tests;

public class PasswordPolicyTests
{
    [Theory]
    [InlineData("abc12345", true)]   // 8, con letras y números
    [InlineData("Abcdef12", true)]
    [InlineData("Largo123456", true)]
    [InlineData("corto1", false)]    // menos de 8
    [InlineData("abcdefgh", false)]  // sin número
    [InlineData("12345678", false)]  // sin letra
    [InlineData("", false)]
    [InlineData(null, false)]
    public void EsValida_aplica_minimo_8_con_letras_y_numeros(string? pwd, bool esperado)
    {
        Assert.Equal(esperado, PasswordPolicy.EsValida(pwd));
    }
}
