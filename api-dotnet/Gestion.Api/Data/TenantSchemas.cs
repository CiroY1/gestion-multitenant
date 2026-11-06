using System.Text.RegularExpressions;
using Npgsql;

namespace Gestion.Api.Data;

/// <summary>
/// Aprovisionamiento de schemas por empresa. La identidad (Empresas, Usuarios)
/// y el historial de migraciones quedan en public; cada empresa tiene su schema
/// (t_&lt;id&gt;) con las tablas de negocio (inventario/terceros) y las del spa.
///
/// El schema de cada empresa se clona desde t_demo con una función SQL
/// (gestion_clone_schema) que crea estructura, índices, checks, SECUENCIAS
/// PROPIAS (reconectando los defaults) y FOREIGN KEYS. Es idempotente, así que
/// al arrancar también repara schemas creados antes (sin secuencias propias/FKs).
/// </summary>
public static class TenantSchemas
{
    private static readonly string[] NoNegocio =
        { "Empresas", "Usuarios", "__EFMigrationsHistory", "NestMigrations" };

    public static async Task AplicarAsync(string connectionString)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        // Mover a t_demo las tablas de negocio que aún estén en public
        // (excluye identidad/historial y las del spa, que mueve Nest).
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

        await EnsureFuncionCloneAsync(conn);
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
        await EnsureFuncionCloneAsync(conn);
        await ProvisionarEnAsync(conn, tenantId);
    }

    private static async Task ProvisionarEnAsync(NpgsqlConnection conn, string tenantId)
    {
        if (!Regex.IsMatch(tenantId, "^[a-z0-9_]+$")) return;
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT gestion_clone_schema('t_demo', @dst)";
        cmd.Parameters.AddWithValue("dst", $"t_{tenantId}");
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Función de clonado de schema (estructura completa): tablas con índices,
    /// checks, secuencias propias (defaults reconectados) y claves foráneas.
    /// Idempotente: no recrea lo que ya existe y repara lo que falte.
    /// </summary>
    private static async Task EnsureFuncionCloneAsync(NpgsqlConnection conn)
    {
        await Exec(conn, """
        CREATE OR REPLACE FUNCTION gestion_clone_schema(src text, dst text)
        RETURNS void AS $func$
        DECLARE rec record;
        BEGIN
          EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', dst);

          -- Tablas: estructura SIN defaults (para no apuntar a las secuencias del origen).
          FOR rec IN
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = src AND table_type = 'BASE TABLE'
          LOOP
            EXECUTE format(
              'CREATE TABLE IF NOT EXISTS %I.%I (LIKE %I.%I INCLUDING IDENTITY INCLUDING INDEXES INCLUDING CONSTRAINTS INCLUDING COMMENTS INCLUDING STORAGE)',
              dst, rec.table_name, src, rec.table_name);
          END LOOP;

          -- Secuencias propias + reconexión de defaults (columnas serial).
          FOR rec IN
            SELECT c.table_name, c.column_name,
                   c.table_name || '_' || c.column_name || '_seq' AS seqname
            FROM information_schema.columns c
            WHERE c.table_schema = src AND c.column_default LIKE 'nextval(%'
          LOOP
            EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.%I', dst, rec.seqname);
            EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT nextval(%L::regclass)',
              dst, rec.table_name, rec.column_name, format('%I.%I', dst, rec.seqname));
            EXECUTE format('ALTER SEQUENCE %I.%I OWNED BY %I.%I.%I',
              dst, rec.seqname, dst, rec.table_name, rec.column_name);
          END LOOP;

          -- Claves foráneas (solo si no existen ya en el destino).
          FOR rec IN
            SELECT con.conname,
                   rel.relname AS table_name,
                   replace(pg_get_constraintdef(con.oid), quote_ident(src) || '.', quote_ident(dst) || '.') AS def
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace ns ON ns.oid = rel.relnamespace
            WHERE ns.nspname = src AND con.contype = 'f'
          LOOP
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint c2
              JOIN pg_class r2 ON r2.oid = c2.conrelid
              JOIN pg_namespace n2 ON n2.oid = r2.relnamespace
              WHERE n2.nspname = dst AND c2.conname = rec.conname
            ) THEN
              EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s',
                dst, rec.table_name, rec.conname, rec.def);
            END IF;
          END LOOP;
        END;
        $func$ LANGUAGE plpgsql;
        """);
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
