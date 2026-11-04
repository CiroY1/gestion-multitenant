namespace Gestion.Api.Auth;

/// <summary>
/// Empresa (tenant). Su Id es el TenantId que llevan todos los datos del negocio.
/// Los flags de módulo definen qué ve cada empresa en el panel.
/// </summary>
public class Empresa
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Nombre { get; set; } = string.Empty;

    // Módulos activados para esta empresa.
    public bool ModuloInventario { get; set; } = true;
    public bool ModuloSpa { get; set; }

    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
