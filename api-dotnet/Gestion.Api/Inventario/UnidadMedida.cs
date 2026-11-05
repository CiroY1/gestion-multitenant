namespace Gestion.Api.Inventario;

/// <summary>Unidad de medida de un producto (p.ej. Unidad, Kilogramo, Litro, Caja).</summary>
public class UnidadMedida
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Abreviatura { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
}
