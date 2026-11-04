namespace Gestion.Api.Inventario;

/// <summary>
/// Remisión (salida/despacho de mercancía a un cliente o destino).
/// Al registrarse, resta stock de cada producto y genera movimientos de salida.
/// </summary>
public class Remision
{
    public int Id { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public string TenantId { get; set; } = string.Empty;

    public ICollection<RemisionLinea> Lineas { get; set; } = new List<RemisionLinea>();
}

/// <summary>Línea de una remisión: un producto y la cantidad despachada.</summary>
public class RemisionLinea
{
    public int Id { get; set; }

    public int RemisionId { get; set; }
    public Remision? Remision { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int Cantidad { get; set; }
}
