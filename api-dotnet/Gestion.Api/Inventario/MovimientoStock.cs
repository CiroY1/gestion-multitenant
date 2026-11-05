namespace Gestion.Api.Inventario;

public enum TipoMovimiento
{
    Entrada = 1,
    Salida = 2
}

/// <summary>
/// Registro de entrada o salida de stock de un producto. Es la base del kardex:
/// cada fila guarda el costo del movimiento y el saldo (cantidad y costo promedio)
/// que quedó después de aplicarlo.
/// </summary>
public class MovimientoStock
{
    public int Id { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public TipoMovimiento Tipo { get; set; }
    public int Cantidad { get; set; }

    /// <summary>Costo unitario del movimiento (compra en entradas; costo promedio en salidas).</summary>
    public decimal CostoUnitario { get; set; }

    /// <summary>Saldo de unidades después de aplicar el movimiento (balance corrido).</summary>
    public int SaldoCantidad { get; set; }

    /// <summary>Costo promedio ponderado después del movimiento.</summary>
    public decimal CostoPromedio { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    /// <summary>Tipo de documento origen: REC, REM, NC, ND, PROD, MAN, HIST.</summary>
    public string? DocumentoTipo { get; set; }

    /// <summary>Número del documento origen, p.ej. "REC-0001".</summary>
    public string? DocumentoNumero { get; set; }

    /// <summary>Descripción del concepto del movimiento.</summary>
    public string? Concepto { get; set; }

    /// <summary>Empresa (tenant) dueña del registro.</summary>
    public string TenantId { get; set; } = string.Empty;
}
