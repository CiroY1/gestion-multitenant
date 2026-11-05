namespace Gestion.Api.Inventario;

/// <summary>Ciclo de vida de una orden de compra.</summary>
public enum EstadoOrden
{
    /// <summary>En edición, aún no aprobada.</summary>
    Borrador = 0,

    /// <summary>Aprobada: lista para recibir, sin recepciones todavía.</summary>
    Aprobada = 1,

    /// <summary>Recibida parcialmente: queda cantidad pendiente.</summary>
    Parcial = 2,

    /// <summary>Recibida en su totalidad.</summary>
    Recibida = 3,

    /// <summary>Cerrada manualmente con saldo pendiente (no se recibe más).</summary>
    Cerrada = 4,

    /// <summary>Anulada.</summary>
    Anulada = 5,
}

/// <summary>
/// Orden de compra a un proveedor. No mueve stock: es el documento contra el que
/// se reciben mercancías (recepciones), que pueden ser parciales o totales.
/// </summary>
public class OrdenCompra
{
    public int Id { get; set; }

    /// <summary>Número consecutivo, p.ej. "OC-0001".</summary>
    public string Numero { get; set; } = string.Empty;

    public string Proveedor { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public EstadoOrden Estado { get; set; } = EstadoOrden.Borrador;
    public DateTime? FechaAprobacion { get; set; }

    public string TenantId { get; set; } = string.Empty;

    public ICollection<OrdenCompraLinea> Lineas { get; set; } = new List<OrdenCompraLinea>();
}

/// <summary>Línea de una orden: producto, cantidad ordenada, costo y cantidad ya recibida.</summary>
public class OrdenCompraLinea
{
    public int Id { get; set; }

    public int OrdenCompraId { get; set; }
    public OrdenCompra? OrdenCompra { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    /// <summary>Cantidad ordenada.</summary>
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }

    /// <summary>Cantidad ya recibida (sube al confirmar recepciones ligadas).</summary>
    public int CantidadRecibida { get; set; }
}
