using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Data;

/// <summary>
/// Contexto de datos de la aplicación. Por ahora vacío; aquí se irán
/// declarando las entidades (p. ej. Inventario) con sus DbSet.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
}
