using Gestion.Api.Auth;
using Gestion.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Data;

/// <summary>Crea datos demo (empresa + usuario) para poder probar el login.</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, PasswordService pwd)
    {
        // Empresa demo con Id "demo": coincide con los datos de inventario ya creados.
        if (!await db.Empresas.AnyAsync(e => e.Id == "demo"))
        {
            db.Empresas.Add(new Empresa
            {
                Id = "demo",
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
                EmpresaId = "demo",
            });
            await db.SaveChangesAsync();
        }
    }
}
