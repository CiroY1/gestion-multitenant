namespace Gestion.Api.Inventario;

public enum TipoMovimiento
{
    Entrada = 1,
    Salida = 2
}

/// <summary>Registro de entrada o salida de stock de un producto.</summary>
public class MovimientoStock
{
    public int Id { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public TipoMovimiento Tipo { get; set; }
    public int Cantidad { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    /// <summary>Empresa (tenant) dueña del registro.</summary>
    public string TenantId { get; set; } = string.Empty;
}
