namespace Gestion.Api.Common;

/// <summary>Provee el TenantId (empresa) de la petición actual.</summary>
public interface ITenantProvider
{
    string GetTenantId();
}

/// <summary>
/// Implementación TEMPORAL: devuelve un tenant fijo de demo.
/// Cuando se agregue el login/JWT, se reemplaza por una que lea el
/// tenantId del token (claims de HttpContext). Único punto a cambiar.
/// </summary>
public class DemoTenantProvider : ITenantProvider
{
    public const string TenantDemo = "demo";
    public string GetTenantId() => TenantDemo;
}
