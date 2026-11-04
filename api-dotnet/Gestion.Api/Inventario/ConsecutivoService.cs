using System.Data;
using Gestion.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace Gestion.Api.Inventario;

/// <summary>
/// Entrega números consecutivos por empresa y tipo de documento.
/// El incremento es atómico (UPSERT con RETURNING), de modo que dos solicitudes
/// concurrentes nunca reciben el mismo número.
/// </summary>
public class ConsecutivoService
{
    private readonly AppDbContext _db;

    public ConsecutivoService(AppDbContext db) => _db = db;

    /// <summary>
    /// Incrementa atómicamente el consecutivo del (tenant, tipo) y devuelve el
    /// número formateado, p.ej. "REC-0001". Si hay una transacción activa en el
    /// DbContext, la operación se enlista en ella.
    /// </summary>
    public async Task<string> SiguienteAsync(string tenantId, string tipo)
    {
        var conn = _db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
            await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();

        var transaccion = _db.Database.CurrentTransaction;
        if (transaccion is not null)
            cmd.Transaction = transaccion.GetDbTransaction();

        cmd.CommandText = @"
            INSERT INTO ""Consecutivos"" (""TenantId"", ""TipoDocumento"", ""UltimoNumero"")
            VALUES (@tenant, @tipo, 1)
            ON CONFLICT (""TenantId"", ""TipoDocumento"")
            DO UPDATE SET ""UltimoNumero"" = ""Consecutivos"".""UltimoNumero"" + 1
            RETURNING ""UltimoNumero"";";
        cmd.Parameters.Add(new NpgsqlParameter("tenant", tenantId));
        cmd.Parameters.Add(new NpgsqlParameter("tipo", tipo));

        var numero = (int)(await cmd.ExecuteScalarAsync())!;
        return $"{tipo}-{numero:D4}";
    }
}
