namespace Gestion.Api.Terceros;

/// <summary>Proveedor (tercero al que se le compra).</summary>
public class Proveedor
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Nit { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string TenantId { get; set; } = string.Empty;
}

/// <summary>Cliente (tercero al que se le vende/despacha).</summary>
public class Cliente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Documento { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string TenantId { get; set; } = string.Empty;
}
