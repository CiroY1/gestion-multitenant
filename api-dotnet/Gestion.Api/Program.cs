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

// Licencia Community de QuestPDF (gratuita para uso permitido).
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

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

// Llave pública RSA para validar los JWT (RS256). La privada solo la usa JwtService.
var rsaPublicKey = new Microsoft.IdentityModel.Tokens.RsaSecurityKey(
    Gestion.Api.Security.RsaKeys.LoadPublic());

// Servicios.
builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddSingleton<SearchPathInterceptor>();
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
    options
        .UseNpgsql(connectionString)
        .AddInterceptors(sp.GetRequiredService<SearchPathInterceptor>()));

// Motor de seguridad + identidad.
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<EncryptionService>();
builder.Services.AddScoped<ITenantProvider, JwtTenantProvider>();
builder.Services.AddScoped<Gestion.Api.Inventario.ConsecutivoService>();
builder.Services.AddScoped<Gestion.Api.Inventario.KardexService>();
builder.Services.AddScoped<Gestion.Api.Documentos.PdfService>();

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
            IssuerSigningKey = rsaPublicKey,
            ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

// Política de super-admin de plataforma (gestiona todas las empresas).
builder.Services.AddAuthorization(options =>
    options.AddPolicy("SuperAdmin", policy => policy.RequireClaim("superAdmin", "1")));

// CORS: orígenes permitidos desde variable de entorno (coma-separados).
// Por defecto, el frontend Angular local. AllowCredentials para auth por cookie.
var corsOrigins = (Environment.GetEnvironmentVariable("CORS_ORIGINS")
                   ?? "http://localhost:4200")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(corsOrigins)
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials()));

var app = builder.Build();

// Seed de datos demo (solo desarrollo): empresa "demo" + usuario admin.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await Gestion.Api.Data.DbSeeder.SeedAsync(
        scope.ServiceProvider.GetRequiredService<AppDbContext>(),
        scope.ServiceProvider.GetRequiredService<Gestion.Api.Security.PasswordService>());

    // Multi-tenant por schema: mover el negocio a t_demo (una vez) y
    // aprovisionar el schema de cada empresa.
    await Gestion.Api.Data.TenantSchemas.AplicarAsync(connectionString);
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

// Endpoint de salud: estado genérico, sin exponer versión ni detalles de error.
app.MapGet("/health/db", async (AppDbContext db) =>
{
    try
    {
        var ok = await db.Database.CanConnectAsync();
        return ok
            ? Results.Ok(new { status = "ok" })
            : Results.Json(new { status = "degraded" }, statusCode: 503);
    }
    catch
    {
        return Results.Json(new { status = "degraded" }, statusCode: 503);
    }
});

app.Run();
