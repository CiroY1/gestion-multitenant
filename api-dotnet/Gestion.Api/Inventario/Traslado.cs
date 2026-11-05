namespace Gestion.Api.Inventario;

/// <summary>
/// Traslado de mercancía entre dos bodegas. Al confirmar, resta de la bodega
/// origen y suma a la destino (el stock total y el costo promedio no cambian);
/// al anular se revierte.
/// </summary>
public class Traslado
{
    public int Id { get; set; }

    /// <summary>Número consecutivo, p.ej. "TR-0001".</summary>
    public string Numero { get; set; } = string.Empty;

    public int BodegaOrigenId { get; set; }
    public Bodega? BodegaOrigen { get; set; }

    public int BodegaDestinoId { get; set; }
    public Bodega? BodegaDestino { get; set; }

    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Borrador;
    public DateTime? FechaConfirmacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }

    public string TenantId { get; set; } = string.Empty;

    public ICollection<TrasladoLinea> Lineas { get; set; } = new List<TrasladoLinea>();
}

/// <summary>Línea de un traslado: un producto y la cantidad a mover.</summary>
public class TrasladoLinea
{
    public int Id { get; set; }

    public int TrasladoId { get; set; }
    public Traslado? Traslado { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int Cantidad { get; set; }
}
