namespace Gestion.Api.Auth;

/// <summary>Usuario que inicia sesión. Pertenece a una empresa (tenant).</summary>
public class Usuario
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;

    /// <summary>Hash de la contraseña (BCrypt). Nunca se guarda en texto plano ni se puede recuperar.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public string Rol { get; set; } = "admin"; // admin / operador

    /// <summary>Si está inactivo, no debería poder operar (control del administrador).</summary>
    public bool Activo { get; set; } = true;

    /// <summary>Super-admin de plataforma: gestiona todas las empresas y sus módulos.</summary>
    public bool EsSuperAdmin { get; set; } = false;

    public string EmpresaId { get; set; } = string.Empty; // = TenantId
    public Empresa? Empresa { get; set; }

    /// <summary>
    /// Dato confidencial de ejemplo, CIFRADO en reposo (AES-256-GCM) con el motor de cifrado.
    /// Aunque se filtre la BD o el JWT, no se puede leer sin la llave (que vive fuera de ambos).
    /// </summary>
    public string? TelefonoCifrado { get; set; }
}
