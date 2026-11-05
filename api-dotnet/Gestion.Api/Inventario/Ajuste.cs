namespace Gestion.Api.Inventario;

/// <summary>
/// Ajuste de inventario: documento que corrige el stock con un motivo
/// (conteo físico, avería, merma, sobrante). Cada línea entra o sale; el stock
/// solo se mueve al confirmar y se revierte al anular.
/// </summary>
public class Ajuste
{
    public int Id { get; set; }

    /// <summary>Número consecutivo, p.ej. "AJU-0001".</summary>
    public string Numero { get; set; } = string.Empty;

    /// <summary>Motivo del ajuste (conteo físico, avería, etc.).</summary>
    public string Motivo { get; set; } = string.Empty;

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Borrador;
    public DateTime? FechaConfirmacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }

    /// <summary>Bodega sobre la que se ajusta el stock.</summary>
    public int? BodegaId { get; set; }
    public Bodega? Bodega { get; set; }

    public string TenantId { get; set; } = string.Empty;

    public ICollection<AjusteLinea> Lineas { get; set; } = new List<AjusteLinea>();
}

/// <summary>Línea de un ajuste: un producto, el sentido (entrada/salida) y la cantidad.</summary>
public class AjusteLinea
{
    public int Id { get; set; }

    public int AjusteId { get; set; }
    public Ajuste? Ajuste { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    /// <summary>Entrada = sobrante/hallazgo; Salida = avería/merma/pérdida.</summary>
    public TipoMovimiento Tipo { get; set; }
    public int Cantidad { get; set; }
}
