using Microsoft.AspNetCore.Http;

namespace Gestion.Api.Common;

/// <summary>Provee el TenantId (empresa) de la petición actual.</summary>
public interface ITenantProvider
{
    string GetTenantId();
}

/// <summary>
/// Lee el tenantId del claim del JWT (puesto por el login). Es el provider real.
/// </summary>
public class JwtTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _http;

    public JwtTenantProvider(IHttpContextAccessor http) => _http = http;

    public string GetTenantId()
        => _http.HttpContext?.User.FindFirst("tenantId")?.Value
           ?? throw new InvalidOperationException("No hay tenant en el token de la petición.");
}

/// <summary>
/// Implementación de respaldo: tenant fijo de demo (sin autenticación).
/// Se mantiene por si se necesita, pero el provider activo es JwtTenantProvider.
/// </summary>
public class DemoTenantProvider : ITenantProvider
{
    public const string TenantDemo = "demo";
    public string GetTenantId() => TenantDemo;
}
