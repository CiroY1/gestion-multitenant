namespace Gestion.Api.Inventario;

/// <summary>
/// Recepción de mercancía (entrada desde un proveedor). Se crea como borrador
/// sin tocar el stock; al confirmarse suma stock y genera los movimientos de
/// entrada, y al anularse revierte ese efecto.
/// </summary>
public class Recepcion
{
    public int Id { get; set; }

    /// <summary>Número consecutivo del documento, p.ej. "REC-0001".</summary>
    public string Numero { get; set; } = string.Empty;

    public string Proveedor { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    /// <summary>Estado del ciclo de vida: borrador, confirmado o anulado.</summary>
    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Borrador;

    public DateTime? FechaConfirmacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }

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
