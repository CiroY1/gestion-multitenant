namespace Gestion.Api.Inventario;

/// <summary>Bodega o almacén de la empresa. El stock se lleva por producto y bodega.</summary>
public class Bodega
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Codigo { get; set; }
    public bool Activa { get; set; } = true;
    public string TenantId { get; set; } = string.Empty;
}

/// <summary>Existencia (stock) de un producto en una bodega concreta.</summary>
public class ExistenciaBodega
{
    public int Id { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int BodegaId { get; set; }
    public Bodega? Bodega { get; set; }

    public int Stock { get; set; }

    public string TenantId { get; set; } = string.Empty;
}
