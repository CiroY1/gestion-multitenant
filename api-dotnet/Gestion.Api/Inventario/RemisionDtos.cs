namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearRemisionLineaDto(int ProductoId, int Cantidad);
public record CrearRemisionDto(string Cliente, string? Observaciones, List<CrearRemisionLineaDto> Lineas);

// Salida
public record RemisionDto(
    int Id, string Numero, string Cliente, string? Observaciones, DateTime Fecha,
    EstadoDocumento Estado, int Unidades, int Items);
public record RemisionLineaDto(int ProductoId, string? Producto, int Cantidad);
public record RemisionDetalleDto(
    int Id, string Numero, string Cliente, string? Observaciones, DateTime Fecha,
    EstadoDocumento Estado, List<RemisionLineaDto> Lineas);
