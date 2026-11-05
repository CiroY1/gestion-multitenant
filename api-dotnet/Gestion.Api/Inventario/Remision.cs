namespace Gestion.Api.Inventario;

/// <summary>
/// Remisión (salida/despacho de mercancía a un cliente o destino). Se crea como
/// borrador sin tocar el stock; al confirmarse resta stock y genera los
/// movimientos de salida, y al anularse revierte ese efecto.
/// </summary>
public class Remision
{
    public int Id { get; set; }

    /// <summary>Número consecutivo del documento, p.ej. "REM-0001".</summary>
    public string Numero { get; set; } = string.Empty;

    public string Cliente { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    /// <summary>Estado del ciclo de vida: borrador, confirmado o anulado.</summary>
    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Borrador;

    public DateTime? FechaConfirmacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }

    /// <summary>Pedido de venta origen (si la remisión se hace contra un pedido).</summary>
    public int? PedidoVentaId { get; set; }
    public PedidoVenta? PedidoVenta { get; set; }

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

    /// <summary>Línea del pedido de venta que esta remisión despacha (si aplica).</summary>
    public int? PedidoVentaLineaId { get; set; }
    public PedidoVentaLinea? PedidoVentaLinea { get; set; }
}
