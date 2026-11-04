using DotNetEnv;
using Gestion.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Cargar variables del .env.local en la raíz del monorepo (solo desarrollo).
var envPath = Path.Combine(builder.Environment.ContentRootPath, "..", "..", ".env.local");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

// Conexión a Neon Postgres (pooled = tráfico normal de la app).
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrWhiteSpace(databaseUrl))
{
    throw new InvalidOperationException(
        "Falta la variable DATABASE_URL. Verifica que exista .env.local en la raíz del proyecto.");
}

var connectionString = NeonConnection.ToNpgsql(databaseUrl);

// Servicios.
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

var app = builder.Build();

// Pipeline HTTP.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Endpoint de salud: prueba la conexión real contra Neon Postgres.
app.MapGet("/health/db", async (AppDbContext db) =>
{
    try
    {
        await db.Database.OpenConnectionAsync();
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = "SELECT version();";
        var version = (string?)await cmd.ExecuteScalarAsync();
        await db.Database.CloseConnectionAsync();

        return Results.Ok(new
        {
            status = "ok",
            database = "neon-postgres",
            version
        });
    }
    catch (Exception ex)
    {
        return Results.Problem("Error de conexión a la base de datos: " + ex.Message);
    }
});

app.Run();
