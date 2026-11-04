using Gestion.Api.Auth;
using Gestion.Api.Inventario;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Data;

/// <summary>
/// Contexto de datos de la aplicación: módulos de Inventario y Auth/multi-tenant.
/// Cada entidad de negocio lleva TenantId para el aislamiento por empresa.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Inventario
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<MovimientoStock> MovimientosStock => Set<MovimientoStock>();
    public DbSet<Recepcion> Recepciones => Set<Recepcion>();
    public DbSet<RecepcionLinea> RecepcionLineas => Set<RecepcionLinea>();
    public DbSet<Remision> Remisiones => Set<Remision>();
    public DbSet<RemisionLinea> RemisionLineas => Set<RemisionLinea>();

    // Auth / multi-tenant
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Inventario
        modelBuilder.Entity<Producto>().Property(p => p.Precio).HasPrecision(12, 2);
        modelBuilder.Entity<Categoria>().HasIndex(c => c.TenantId);
        modelBuilder.Entity<Producto>().HasIndex(p => p.TenantId);
        modelBuilder.Entity<MovimientoStock>().HasIndex(m => m.TenantId);

        // Recepciones
        modelBuilder.Entity<Recepcion>().HasIndex(r => r.TenantId);
        modelBuilder.Entity<RecepcionLinea>().Property(l => l.CostoUnitario).HasPrecision(12, 2);
        modelBuilder.Entity<Recepcion>()
            .HasMany(r => r.Lineas)
            .WithOne(l => l.Recepcion!)
            .HasForeignKey(l => l.RecepcionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Remisiones
        modelBuilder.Entity<Remision>().HasIndex(r => r.TenantId);
        modelBuilder.Entity<Remision>()
            .HasMany(r => r.Lineas)
            .WithOne(l => l.Remision!)
            .HasForeignKey(l => l.RemisionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Empresa: el Id (tenantId) lo asigna la app, no es autogenerado.
        modelBuilder.Entity<Empresa>().Property(e => e.Id).ValueGeneratedNever();

        // Usuario: email único a nivel global; relación con su empresa.
        modelBuilder.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Empresa)
            .WithMany(e => e.Usuarios)
            .HasForeignKey(u => u.EmpresaId);

        base.OnModelCreating(modelBuilder);
    }
}
