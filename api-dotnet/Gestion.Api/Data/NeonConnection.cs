using Npgsql;

namespace Gestion.Api.Data;

/// <summary>
/// Convierte la URL de conexión de Neon (formato URI, p. ej.
/// postgresql://usuario:clave@host/basededatos?sslmode=require)
/// al formato clave=valor que entiende Npgsql.
/// </summary>
public static class NeonConnection
{
    public static string ToNpgsql(string databaseUrl)
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = SslMode.Require,
        };

        return builder.ConnectionString;
    }
}
