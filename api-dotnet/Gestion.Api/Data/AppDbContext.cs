using Gestion.Api.Inventario;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Data;

/// <summary>
/// Contexto de datos de la aplicación. Declara las entidades del módulo de
/// Inventario. Cada entidad lleva TenantId para el aislamiento multi-tenant.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<MovimientoStock> MovimientosStock => Set<MovimientoStock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Precio con 2 decimales.
        modelBuilder.Entity<Producto>().Property(p => p.Precio).HasPrecision(12, 2);

        // Índices por empresa (tenant) para consultas y aislamiento.
        modelBuilder.Entity<Categoria>().HasIndex(c => c.TenantId);
        modelBuilder.Entity<Producto>().HasIndex(p => p.TenantId);
        modelBuilder.Entity<MovimientoStock>().HasIndex(m => m.TenantId);

        base.OnModelCreating(modelBuilder);
    }
}
