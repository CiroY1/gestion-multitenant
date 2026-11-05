using Gestion.Api.Auth;
using Gestion.Api.Inventario;
using Gestion.Api.Terceros;
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
    public DbSet<Receta> Recetas => Set<Receta>();
    public DbSet<RecetaIngrediente> RecetaIngredientes => Set<RecetaIngrediente>();
    public DbSet<Consecutivo> Consecutivos => Set<Consecutivo>();
    public DbSet<Nota> Notas => Set<Nota>();
    public DbSet<NotaLinea> NotaLineas => Set<NotaLinea>();
    public DbSet<OrdenCompra> OrdenesCompra => Set<OrdenCompra>();
    public DbSet<OrdenCompraLinea> OrdenCompraLineas => Set<OrdenCompraLinea>();
    public DbSet<PedidoVenta> PedidosVenta => Set<PedidoVenta>();
    public DbSet<PedidoVentaLinea> PedidoVentaLineas => Set<PedidoVentaLinea>();
    public DbSet<Ajuste> Ajustes => Set<Ajuste>();
    public DbSet<AjusteLinea> AjusteLineas => Set<AjusteLinea>();
    public DbSet<Bodega> Bodegas => Set<Bodega>();
    public DbSet<ExistenciaBodega> ExistenciaBodegas => Set<ExistenciaBodega>();

    // Terceros
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Cliente> Clientes => Set<Cliente>();

    // Auth / multi-tenant
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Inventario
        modelBuilder.Entity<Producto>().Property(p => p.Precio).HasPrecision(12, 2);
        modelBuilder.Entity<Producto>().Property(p => p.CostoPromedio).HasPrecision(12, 2);
        modelBuilder.Entity<Categoria>().HasIndex(c => c.TenantId);
        modelBuilder.Entity<Producto>().HasIndex(p => p.TenantId);
        modelBuilder.Entity<MovimientoStock>().HasIndex(m => m.TenantId);
        modelBuilder.Entity<MovimientoStock>().HasIndex(m => new { m.TenantId, m.ProductoId });
        modelBuilder.Entity<MovimientoStock>().Property(m => m.CostoUnitario).HasPrecision(12, 2);
        modelBuilder.Entity<MovimientoStock>().Property(m => m.CostoPromedio).HasPrecision(12, 2);

        // Consecutivos: una secuencia por (empresa, tipo de documento).
        modelBuilder.Entity<Consecutivo>()
            .HasIndex(c => new { c.TenantId, c.TipoDocumento }).IsUnique();

        // Órdenes de compra
        modelBuilder.Entity<OrdenCompra>().HasIndex(o => o.TenantId);
        modelBuilder.Entity<OrdenCompra>().HasIndex(o => new { o.TenantId, o.Numero });
        modelBuilder.Entity<OrdenCompraLinea>().Property(l => l.CostoUnitario).HasPrecision(12, 2);
        modelBuilder.Entity<OrdenCompra>()
            .HasMany(o => o.Lineas).WithOne(l => l.OrdenCompra!)
            .HasForeignKey(l => l.OrdenCompraId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<OrdenCompraLinea>()
            .HasOne(l => l.Producto).WithMany()
            .HasForeignKey(l => l.ProductoId).OnDelete(DeleteBehavior.Restrict);

        // Recepciones
        modelBuilder.Entity<Recepcion>().HasIndex(r => r.TenantId);
        modelBuilder.Entity<Recepcion>().HasIndex(r => new { r.TenantId, r.Numero });
        modelBuilder.Entity<RecepcionLinea>().Property(l => l.CostoUnitario).HasPrecision(12, 2);
        modelBuilder.Entity<Recepcion>()
            .HasMany(r => r.Lineas)
            .WithOne(l => l.Recepcion!)
            .HasForeignKey(l => l.RecepcionId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Recepcion>()
            .HasOne(r => r.OrdenCompra).WithMany()
            .HasForeignKey(r => r.OrdenCompraId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RecepcionLinea>()
            .HasOne(l => l.OrdenCompraLinea).WithMany()
            .HasForeignKey(l => l.OrdenCompraLineaId).OnDelete(DeleteBehavior.Restrict);

        // Pedidos de venta
        modelBuilder.Entity<PedidoVenta>().HasIndex(p => p.TenantId);
        modelBuilder.Entity<PedidoVenta>().HasIndex(p => new { p.TenantId, p.Numero });
        modelBuilder.Entity<PedidoVentaLinea>().Property(l => l.PrecioUnitario).HasPrecision(12, 2);
        modelBuilder.Entity<PedidoVenta>()
            .HasMany(p => p.Lineas).WithOne(l => l.PedidoVenta!)
            .HasForeignKey(l => l.PedidoVentaId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<PedidoVentaLinea>()
            .HasOne(l => l.Producto).WithMany()
            .HasForeignKey(l => l.ProductoId).OnDelete(DeleteBehavior.Restrict);

        // Remisiones
        modelBuilder.Entity<Remision>().HasIndex(r => r.TenantId);
        modelBuilder.Entity<Remision>().HasIndex(r => new { r.TenantId, r.Numero });
        modelBuilder.Entity<Remision>()
            .HasMany(r => r.Lineas)
            .WithOne(l => l.Remision!)
            .HasForeignKey(l => l.RemisionId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Remision>()
            .HasOne(r => r.PedidoVenta).WithMany()
            .HasForeignKey(r => r.PedidoVentaId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RemisionLinea>()
            .HasOne(l => l.PedidoVentaLinea).WithMany()
            .HasForeignKey(l => l.PedidoVentaLineaId).OnDelete(DeleteBehavior.Restrict);

        // Recetas
        modelBuilder.Entity<Receta>().HasIndex(r => r.TenantId);
        modelBuilder.Entity<Receta>()
            .HasMany(r => r.Ingredientes).WithOne(i => i.Receta!)
            .HasForeignKey(i => i.RecetaId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Receta>()
            .HasOne(r => r.ProductoFinal).WithMany()
            .HasForeignKey(r => r.ProductoFinalId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RecetaIngrediente>()
            .HasOne(i => i.Producto).WithMany()
            .HasForeignKey(i => i.ProductoId).OnDelete(DeleteBehavior.Restrict);

        // Bodegas y existencias
        modelBuilder.Entity<Bodega>().HasIndex(b => b.TenantId);
        modelBuilder.Entity<ExistenciaBodega>()
            .HasIndex(e => new { e.TenantId, e.ProductoId, e.BodegaId }).IsUnique();
        modelBuilder.Entity<ExistenciaBodega>()
            .HasOne(e => e.Producto).WithMany()
            .HasForeignKey(e => e.ProductoId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ExistenciaBodega>()
            .HasOne(e => e.Bodega).WithMany()
            .HasForeignKey(e => e.BodegaId).OnDelete(DeleteBehavior.Restrict);

        // Bodega en los movimientos y documentos (opcional, sin borrado en cascada).
        modelBuilder.Entity<MovimientoStock>()
            .HasOne(m => m.Bodega).WithMany()
            .HasForeignKey(m => m.BodegaId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Recepcion>()
            .HasOne(r => r.Bodega).WithMany()
            .HasForeignKey(r => r.BodegaId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Remision>()
            .HasOne(r => r.Bodega).WithMany()
            .HasForeignKey(r => r.BodegaId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Ajuste>()
            .HasOne(a => a.Bodega).WithMany()
            .HasForeignKey(a => a.BodegaId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Nota>()
            .HasOne(n => n.Bodega).WithMany()
            .HasForeignKey(n => n.BodegaId).OnDelete(DeleteBehavior.Restrict);

        // Ajustes de inventario
        modelBuilder.Entity<Ajuste>().HasIndex(a => a.TenantId);
        modelBuilder.Entity<Ajuste>().HasIndex(a => new { a.TenantId, a.Numero });
        modelBuilder.Entity<Ajuste>()
            .HasMany(a => a.Lineas).WithOne(l => l.Ajuste!)
            .HasForeignKey(l => l.AjusteId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AjusteLinea>()
            .HasOne(l => l.Producto).WithMany()
            .HasForeignKey(l => l.ProductoId).OnDelete(DeleteBehavior.Restrict);

        // Notas crédito/débito
        modelBuilder.Entity<Nota>().HasIndex(n => n.TenantId);
        modelBuilder.Entity<Nota>().HasIndex(n => new { n.TenantId, n.Numero });
        modelBuilder.Entity<NotaLinea>().Property(l => l.CostoUnitario).HasPrecision(12, 2);
        modelBuilder.Entity<Nota>()
            .HasMany(n => n.Lineas).WithOne(l => l.Nota!)
            .HasForeignKey(l => l.NotaId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Nota>()
            .HasOne(n => n.Remision).WithMany()
            .HasForeignKey(n => n.RemisionId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Nota>()
            .HasOne(n => n.Recepcion).WithMany()
            .HasForeignKey(n => n.RecepcionId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<NotaLinea>()
            .HasOne(l => l.Producto).WithMany()
            .HasForeignKey(l => l.ProductoId).OnDelete(DeleteBehavior.Restrict);

        // Terceros
        modelBuilder.Entity<Proveedor>().HasIndex(p => p.TenantId);
        modelBuilder.Entity<Cliente>().HasIndex(c => c.TenantId);

        // Proteger el historial: impedir borrar productos/categorías referenciados.
        modelBuilder.Entity<MovimientoStock>()
            .HasOne(m => m.Producto).WithMany(p => p.Movimientos)
            .HasForeignKey(m => m.ProductoId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RecepcionLinea>()
            .HasOne(l => l.Producto).WithMany()
            .HasForeignKey(l => l.ProductoId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RemisionLinea>()
            .HasOne(l => l.Producto).WithMany()
            .HasForeignKey(l => l.ProductoId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Producto>()
            .HasOne(p => p.Categoria).WithMany(c => c.Productos)
            .HasForeignKey(p => p.CategoriaId).OnDelete(DeleteBehavior.Restrict);

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
