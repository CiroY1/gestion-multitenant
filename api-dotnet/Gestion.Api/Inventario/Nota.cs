namespace Gestion.Api.Inventario;

/// <summary>Tipo de nota contable con efecto en inventario.</summary>
public enum TipoNota
{
    /// <summary>Devolución de un cliente sobre una remisión: la mercancía regresa (suma stock).</summary>
    Credito = 1,

    /// <summary>Devolución a un proveedor sobre una recepción: la mercancía sale (resta stock).</summary>
    Debito = 2,
}

/// <summary>
/// Nota crédito o débito: documento de devolución ligado a un documento origen
/// (remisión para las de crédito, recepción para las de débito). Sigue el mismo
/// ciclo Borrador → Confirmado → Anulado; el stock solo se mueve al confirmar.
/// </summary>
public class Nota
{
    public int Id { get; set; }

    /// <summary>Número consecutivo, p.ej. "NC-0001" o "ND-0001".</summary>
    public string Numero { get; set; } = string.Empty;

    public TipoNota Tipo { get; set; }

    /// <summary>Remisión origen (solo para notas crédito).</summary>
    public int? RemisionId { get; set; }
    public Remision? Remision { get; set; }

    /// <summary>Recepción origen (solo para notas débito).</summary>
    public int? RecepcionId { get; set; }
    public Recepcion? Recepcion { get; set; }

    public string? Motivo { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Borrador;
    public DateTime? FechaConfirmacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }

    /// <summary>Bodega afectada (crédito entra a ella; débito sale de ella).</summary>
    public int? BodegaId { get; set; }
    public Bodega? Bodega { get; set; }

    public string TenantId { get; set; } = string.Empty;

    public ICollection<NotaLinea> Lineas { get; set; } = new List<NotaLinea>();
}

/// <summary>Línea de una nota: un producto, la cantidad devuelta y su costo/valor unitario.</summary>
public class NotaLinea
{
    public int Id { get; set; }

    public int NotaId { get; set; }
    public Nota? Nota { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
}
