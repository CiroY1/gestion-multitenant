namespace Gestion.Api.Inventario;

/// <summary>Ciclo de vida de un pedido de venta.</summary>
public enum EstadoPedido
{
    /// <summary>En edición, aún no aprobado.</summary>
    Borrador = 0,

    /// <summary>Aprobado: listo para despachar, sin remisiones todavía.</summary>
    Aprobado = 1,

    /// <summary>Despachado parcialmente: queda cantidad pendiente.</summary>
    Parcial = 2,

    /// <summary>Despachado en su totalidad.</summary>
    Despachado = 3,

    /// <summary>Cerrado manualmente con saldo pendiente (no se despacha más).</summary>
    Cerrado = 4,

    /// <summary>Anulado.</summary>
    Anulado = 5,
}

/// <summary>
/// Pedido de venta de un cliente. No mueve stock: es el documento contra el que
/// se despacha mercancía (remisiones), que pueden ser parciales o totales.
/// </summary>
public class PedidoVenta
{
    public int Id { get; set; }

    /// <summary>Número consecutivo, p.ej. "PV-0001".</summary>
    public string Numero { get; set; } = string.Empty;

    public string Cliente { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public EstadoPedido Estado { get; set; } = EstadoPedido.Borrador;
    public DateTime? FechaAprobacion { get; set; }

    public string TenantId { get; set; } = string.Empty;

    public ICollection<PedidoVentaLinea> Lineas { get; set; } = new List<PedidoVentaLinea>();
}

/// <summary>Línea de un pedido: producto, cantidad pedida, precio y cantidad ya despachada.</summary>
public class PedidoVentaLinea
{
    public int Id { get; set; }

    public int PedidoVentaId { get; set; }
    public PedidoVenta? PedidoVenta { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    /// <summary>Cantidad pedida.</summary>
    public int Cantidad { get; set; }

    /// <summary>Precio de venta unitario pactado.</summary>
    public decimal PrecioUnitario { get; set; }

    /// <summary>Cantidad ya despachada (sube al confirmar remisiones ligadas).</summary>
    public int CantidadDespachada { get; set; }
}
