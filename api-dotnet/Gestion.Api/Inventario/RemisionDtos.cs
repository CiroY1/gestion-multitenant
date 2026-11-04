namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearRemisionLineaDto(int ProductoId, int Cantidad);
public record CrearRemisionDto(string Cliente, string? Observaciones, List<CrearRemisionLineaDto> Lineas);

// Salida
public record RemisionDto(int Id, string Cliente, string? Observaciones, DateTime Fecha, int Unidades, int Items);
public record RemisionLineaDto(int ProductoId, string? Producto, int Cantidad);
public record RemisionDetalleDto(
    int Id, string Cliente, string? Observaciones, DateTime Fecha,
    List<RemisionLineaDto> Lineas);
