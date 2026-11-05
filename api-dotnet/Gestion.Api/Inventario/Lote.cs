namespace Gestion.Api.Inventario;

/// <summary>
/// Lote de un producto, con su fecha de vencimiento. Solo aplica a productos
/// marcados como RastreaLotes. El stock del lote se lleva por bodega en
/// ExistenciaLote y se consume por FEFO (primero el que vence antes).
/// </summary>
public class Lote
{
    public int Id { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public string Codigo { get; set; } = string.Empty;
    public DateTime? FechaVencimiento { get; set; }

    public string TenantId { get; set; } = string.Empty;
}

/// <summary>Existencia (stock) de un lote en una bodega concreta.</summary>
public class ExistenciaLote
{
    public int Id { get; set; }

    public int ProductoId { get; set; }
    public int BodegaId { get; set; }

    public int LoteId { get; set; }
    public Lote? Lote { get; set; }

    public int Stock { get; set; }

    public string TenantId { get; set; } = string.Empty;
}
