namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearTrasladoLineaDto(int ProductoId, int Cantidad);
public record CrearTrasladoDto(
    int BodegaOrigenId, int BodegaDestinoId, string? Observaciones, List<CrearTrasladoLineaDto> Lineas);

// Salida
public record TrasladoLineaDto(int ProductoId, string? Producto, int Cantidad);
public record TrasladoDto(
    int Id, string Numero, string BodegaOrigen, string BodegaDestino, DateTime Fecha,
    EstadoDocumento Estado, int Items);
public record TrasladoDetalleDto(
    int Id, string Numero, string BodegaOrigen, string BodegaDestino, string? Observaciones,
    DateTime Fecha, EstadoDocumento Estado, List<TrasladoLineaDto> Lineas);
