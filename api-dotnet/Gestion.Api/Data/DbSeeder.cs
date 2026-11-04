using Gestion.Api.Auth;
using Gestion.Api.Inventario;
using Gestion.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Data;

/// <summary>Crea datos demo (empresa, usuario e inventario) para poder probar la app.</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, PasswordService pwd)
    {
        const string tenant = "demo";

        // Empresa demo con Id "demo".
        if (!await db.Empresas.AnyAsync(e => e.Id == tenant))
        {
            db.Empresas.Add(new Empresa
            {
                Id = tenant,
                Nombre = "Empresa Demo",
                ModuloInventario = true,
                ModuloSpa = false,
            });
            await db.SaveChangesAsync();
        }

        // Usuario administrador demo.
        if (!await db.Usuarios.AnyAsync(u => u.Email == "admin@demo.com"))
        {
            db.Usuarios.Add(new Usuario
            {
                Email = "admin@demo.com",
                PasswordHash = pwd.Hash("demo1234"),
                Rol = "admin",
                EmpresaId = tenant,
            });
            await db.SaveChangesAsync();
        }

        // Inventario demo (si hay pocos productos, poblar para que no se vea vacío).
        if (await db.Productos.CountAsync(p => p.TenantId == tenant) < 3)
        {
            var mapa = new Dictionary<string, int>();
            foreach (var nombre in new[] { "Bebidas", "Snacks", "Aseo", "Lácteos" })
            {
                var cat = await db.Categorias.FirstOrDefaultAsync(c => c.Nombre == nombre && c.TenantId == tenant);
                if (cat is null)
                {
                    cat = new Categoria { Nombre = nombre, TenantId = tenant };
                    db.Categorias.Add(cat);
                    await db.SaveChangesAsync();
                }
                mapa[nombre] = cat.Id;
            }

            var demo = new[]
            {
                new Producto { Nombre = "Agua Cristal 600ml", Descripcion = "Botella", Precio = 1800m, Stock = 120, CategoriaId = mapa["Bebidas"], TenantId = tenant },
                new Producto { Nombre = "Jugo Hit 250ml", Descripcion = "Caja", Precio = 2200m, Stock = 60, CategoriaId = mapa["Bebidas"], TenantId = tenant },
                new Producto { Nombre = "Papas Margarita", Descripcion = "Paquete 45g", Precio = 2500m, Stock = 80, CategoriaId = mapa["Snacks"], TenantId = tenant },
                new Producto { Nombre = "Galletas Festival", Descripcion = "Taco x6", Precio = 3200m, Stock = 0, CategoriaId = mapa["Snacks"], TenantId = tenant },
                new Producto { Nombre = "Jabón Rey", Descripcion = "Barra 300g", Precio = 2800m, Stock = 35, CategoriaId = mapa["Aseo"], TenantId = tenant },
                new Producto { Nombre = "Detergente Fab 1kg", Descripcion = "Bolsa", Precio = 9900m, Stock = 18, CategoriaId = mapa["Aseo"], TenantId = tenant },
                new Producto { Nombre = "Leche Alpina 1L", Descripcion = "Entera", Precio = 4300m, Stock = 42, CategoriaId = mapa["Lácteos"], TenantId = tenant },
                new Producto { Nombre = "Yogur Alpina 150g", Descripcion = "Fresa", Precio = 1900m, Stock = 0, CategoriaId = mapa["Lácteos"], TenantId = tenant },
            };

            foreach (var p in demo)
            {
                if (!await db.Productos.AnyAsync(x => x.Nombre == p.Nombre && x.TenantId == tenant))
                    db.Productos.Add(p);
            }
            await db.SaveChangesAsync();
        }
    }
}
