using System.Text;
using System.Text.Json.Serialization;
using DotNetEnv;
using Gestion.Api.Common;
using Gestion.Api.Data;
using Gestion.Api.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Cargar variables del .env.local en la raíz del monorepo (solo desarrollo).
var envPath = Path.Combine(builder.Environment.ContentRootPath, "..", "..", ".env.local");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

// Conexión a Neon Postgres (pooled = tráfico normal de la app).
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? throw new InvalidOperationException("Falta DATABASE_URL. Verifica .env.local.");
var connectionString = NeonConnection.ToNpgsql(databaseUrl);

// Secreto para validar los JWT (el mismo que JwtService usa para firmarlos).
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? throw new InvalidOperationException("Falta JWT_SECRET. Verifica .env.local.");

// Servicios.
builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// Motor de seguridad + identidad.
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<EncryptionService>();
builder.Services.AddScoped<ITenantProvider, JwtTenantProvider>();

// Validación de JWT (HS256 con el secreto compartido).
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = JwtService.Issuer,
            ValidateAudience = true,
            ValidAudience = JwtService.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

// CORS: permitir que el frontend Angular (localhost:4200) consuma la API.
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("http://localhost:4200")
          .AllowAnyHeader()
          .AllowAnyMethod()));

var app = builder.Build();

// Seed de datos demo (solo desarrollo): empresa "demo" + usuario admin.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await Gestion.Api.Data.DbSeeder.SeedAsync(
        scope.ServiceProvider.GetRequiredService<AppDbContext>(),
        scope.ServiceProvider.GetRequiredService<Gestion.Api.Security.PasswordService>());
}

// Pipeline HTTP.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // UI para probar la API en /scalar/v1
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
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
