using System.Text.RegularExpressions;
using Npgsql;

namespace Gestion.Api.Data;

/// <summary>
/// Aprovisionamiento de schemas por empresa. La identidad (Empresas, Usuarios)
/// y el historial de migraciones quedan en public; cada empresa tiene su schema
/// (t_&lt;id&gt;) con las tablas de negocio (inventario/terceros) y las del spa.
///
/// - <see cref="AplicarAsync"/>: al arrancar, mueve a t_demo el negocio que aún
///   esté en public y aprovisiona el schema de cada empresa.
/// - <see cref="ProvisionarAsync"/>: crea/garantiza el schema de UNA empresa al
///   vuelo (al crearla), sin reiniciar.
/// </summary>
public static class TenantSchemas
{
    private static readonly string[] NoNegocio =
        { "Empresas", "Usuarios", "__EFMigrationsHistory", "NestMigrations" };

    public static async Task AplicarAsync(string connectionString)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        // 1) Mover a t_demo las tablas de negocio que aún estén en public
        //    (excluye identidad/historial y las del spa, que mueve Nest).
        var aMover = (await TablasAsync(conn, "public"))
            .Where(t => !NoNegocio.Contains(t) && !t.StartsWith("Spa"))
            .ToList();
        if (aMover.Count > 0)
        {
            await Exec(conn, "CREATE SCHEMA IF NOT EXISTS \"t_demo\"");
            foreach (var t in aMover)
            {
                await Exec(conn, $"ALTER TABLE IF EXISTS public.\"{t}\" SET SCHEMA \"t_demo\"");
            }
        }

        // 2) Aprovisionar el schema de cada empresa.
        foreach (var id in await EmpresasAsync(conn))
        {
            await ProvisionarEnAsync(conn, id);
        }
    }

    /// <summary>Crea/garantiza el schema de una empresa (al crearla, en caliente).</summary>
    public static async Task ProvisionarAsync(string connectionString, string tenantId)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await ProvisionarEnAsync(conn, tenantId);
    }

    /// <summary>
    /// Crea el schema del tenant y replica dentro TODAS las tablas de t_demo
    /// (negocio + spa) con LIKE. Idempotente (IF NOT EXISTS).
    /// </summary>
    private static async Task ProvisionarEnAsync(NpgsqlConnection conn, string tenantId)
    {
        if (!Regex.IsMatch(tenantId, "^[a-z0-9_]+$")) return;
        var schema = $"t_{tenantId}";
        await Exec(conn, $"CREATE SCHEMA IF NOT EXISTS \"{schema}\"");

        // Plantilla: todas las tablas de t_demo (negocio y spa).
        var plantilla = await TablasAsync(conn, "t_demo");
        foreach (var t in plantilla)
        {
            await Exec(conn,
                $"CREATE TABLE IF NOT EXISTS \"{schema}\".\"{t}\" " +
                $"(LIKE \"t_demo\".\"{t}\" INCLUDING ALL)");
        }
    }

    private static async Task<List<string>> TablasAsync(NpgsqlConnection conn, string schema)
    {
        var lista = new List<string>();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText =
            "SELECT table_name FROM information_schema.tables " +
            "WHERE table_schema = @s AND table_type = 'BASE TABLE'";
        cmd.Parameters.AddWithValue("s", schema);
        await using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync()) lista.Add(r.GetString(0));
        return lista;
    }

    private static async Task<List<string>> EmpresasAsync(NpgsqlConnection conn)
    {
        var lista = new List<string>();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT \"Id\" FROM public.\"Empresas\"";
        await using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync()) lista.Add(r.GetString(0));
        return lista;
    }

    private static async Task Exec(NpgsqlConnection conn, string sql)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        await cmd.ExecuteNonQueryAsync();
    }
}
