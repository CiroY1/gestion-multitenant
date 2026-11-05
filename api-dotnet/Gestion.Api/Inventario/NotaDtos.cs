namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearNotaLineaDto(int ProductoId, int Cantidad);
public record CrearNotaDto(TipoNota Tipo, int DocumentoOrigenId, string? Motivo, List<CrearNotaLineaDto> Lineas, int? BodegaId = null);

// Salida
public record NotaLineaDto(int ProductoId, string? Producto, int Cantidad, decimal CostoUnitario);
public record NotaDto(
    int Id, string Numero, TipoNota Tipo, string? DocumentoOrigen, string? Motivo,
    DateTime Fecha, EstadoDocumento Estado, decimal Total, int Items);
public record NotaDetalleDto(
    int Id, string Numero, TipoNota Tipo, string? DocumentoOrigen, string? Motivo,
    DateTime Fecha, EstadoDocumento Estado, List<NotaLineaDto> Lineas);
