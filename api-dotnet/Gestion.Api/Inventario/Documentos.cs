namespace Gestion.Api.Inventario;

/// <summary>
/// Ciclo de vida de un documento de inventario (recepción, remisión).
/// El stock solo se mueve al confirmar y se revierte al anular.
/// </summary>
public enum EstadoDocumento
{
    /// <summary>Creado pero sin afectar stock todavía. Puede confirmarse o anularse.</summary>
    Borrador = 0,

    /// <summary>Confirmado: ya movió el stock. Solo puede anularse.</summary>
    Confirmado = 1,

    /// <summary>Anulado: su efecto sobre el stock fue revertido. Estado final.</summary>
    Anulado = 2,
}

/// <summary>
/// Contador de numeración consecutiva por empresa (tenant) y tipo de documento
/// (REC = recepción, REM = remisión). Garantiza números únicos y secuenciales.
/// </summary>
public class Consecutivo
{
    public int Id { get; set; }

    /// <summary>Empresa (tenant) dueña de la secuencia.</summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>Prefijo del tipo de documento, p.ej. "REC" o "REM".</summary>
    public string TipoDocumento { get; set; } = string.Empty;

    /// <summary>Último número entregado para este (tenant, tipo).</summary>
    public int UltimoNumero { get; set; }
}
