using System.Data.Common;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Gestion.Api.Data;

/// <summary>
/// Multi-tenant por schema: al abrir cada conexión fija el search_path al schema
/// de la empresa de la petición (t_&lt;tenant&gt;) con public de respaldo. Así las
/// tablas de negocio resuelven al schema del tenant y la identidad a public.
/// Si no hay tenant (login, arranque), usa solo public.
/// </summary>
public class SearchPathInterceptor : DbConnectionInterceptor
{
    private readonly IHttpContextAccessor _http;

    public SearchPathInterceptor(IHttpContextAccessor http) => _http = http;

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = Sql();
        cmd.ExecuteNonQuery();
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = Sql();
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private string Sql()
    {
        var tenant = _http.HttpContext?.User?.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenant) && Regex.IsMatch(tenant, "^[a-z0-9_]+$"))
        {
            return $"SET search_path TO \"t_{tenant}\", public";
        }
        return "SET search_path TO public";
    }
}
