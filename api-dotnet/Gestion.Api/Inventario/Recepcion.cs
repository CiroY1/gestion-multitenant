namespace Gestion.Api.Inventario;

/// <summary>
/// Recepción de mercancía (entrada desde un proveedor). Al registrarse,
/// suma stock a cada producto y genera los movimientos de entrada.
/// </summary>
public class Recepcion
{
    public int Id { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public string TenantId { get; set; } = string.Empty;

    public ICollection<RecepcionLinea> Lineas { get; set; } = new List<RecepcionLinea>();
}

/// <summary>Línea de una recepción: un producto, su cantidad y costo unitario.</summary>
public class RecepcionLinea
{
    public int Id { get; set; }

    public int RecepcionId { get; set; }
    public Recepcion? Recepcion { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
}
