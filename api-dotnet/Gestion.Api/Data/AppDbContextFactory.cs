using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Gestion.Api.Data;

/// <summary>
/// Fábrica usada por las herramientas de EF Core (migraciones) en tiempo de diseño.
/// Usa la conexión DIRECTA (unpooled), como recomienda Neon para migraciones.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        // El .env.local está en la raíz del monorepo (dos niveles arriba del proyecto).
        var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env.local");
        if (File.Exists(envPath))
        {
            Env.Load(envPath);
        }

        var url = Environment.GetEnvironmentVariable("DATABASE_URL_UNPOOLED")
                  ?? Environment.GetEnvironmentVariable("DATABASE_URL")
                  ?? throw new InvalidOperationException(
                      "Falta DATABASE_URL_UNPOOLED (ni DATABASE_URL) en .env.local");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(NeonConnection.ToNpgsql(url))
            .Options;

        return new AppDbContext(options);
    }
}
