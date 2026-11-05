namespace Gestion.Api.Inventario;

/// <summary>Producto del inventario.</summary>
public class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }

    /// <summary>Costo promedio ponderado actual (se recalcula en cada entrada con costo).</summary>
    public decimal CostoPromedio { get; set; }

    public int CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }

    /// <summary>Unidad de medida base del producto.</summary>
    public int? UnidadMedidaId { get; set; }
    public UnidadMedida? UnidadMedida { get; set; }

    /// <summary>Empresa (tenant) dueña del registro.</summary>
    public string TenantId { get; set; } = string.Empty;

    public ICollection<MovimientoStock> Movimientos { get; set; } = new List<MovimientoStock>();
}
