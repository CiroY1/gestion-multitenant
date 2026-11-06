using System.Text.RegularExpressions;
using Npgsql;

namespace Gestion.Api.Data;

/// <summary>
/// Aprovisionamiento de schemas por empresa para los datos de NEGOCIO (.NET:
/// inventario y terceros). La identidad (Empresas, Usuarios) y el historial de
/// migraciones quedan en public; las tablas del spa las maneja el backend Nest.
///
/// Al arrancar: (1) si el negocio todavía vive en public (layout viejo), lo
/// mueve a t_demo (preserva datos, FKs y secuencias); (2) por cada empresa crea
/// su schema y replica las tablas de negocio desde t_demo (plantilla).
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
        var enPublic = await TablasAsync(conn, "public");
        var aMover = enPublic
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

        // 2) Aprovisionar el schema de cada empresa replicando las tablas de
        //    negocio desde t_demo (plantilla). Las del spa las crea Nest.
        var plantilla = (await TablasAsync(conn, "t_demo"))
            .Where(t => !t.StartsWith("Spa"))
            .ToList();
        if (plantilla.Count == 0) return;

        foreach (var id in await EmpresasAsync(conn))
        {
            if (!Regex.IsMatch(id, "^[a-z0-9_]+$")) continue;
            var schema = $"t_{id}";
            await Exec(conn, $"CREATE SCHEMA IF NOT EXISTS \"{schema}\"");
            foreach (var t in plantilla)
            {
                await Exec(conn,
                    $"CREATE TABLE IF NOT EXISTS \"{schema}\".\"{t}\" " +
                    $"(LIKE \"t_demo\".\"{t}\" INCLUDING ALL)");
            }
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
