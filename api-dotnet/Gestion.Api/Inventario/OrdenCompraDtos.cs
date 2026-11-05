namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearOrdenLineaDto(int ProductoId, int Cantidad, decimal CostoUnitario);
public record CrearOrdenCompraDto(string Proveedor, string? Observaciones, List<CrearOrdenLineaDto> Lineas);

// Salida
public record OrdenCompraDto(
    int Id, string Numero, string Proveedor, string? Observaciones, DateTime Fecha,
    EstadoOrden Estado, decimal Total, int Items, int Pendiente);

public record OrdenLineaDto(
    int LineaId, int ProductoId, string? Producto, int Cantidad, decimal CostoUnitario,
    int Recibida, int Pendiente);

public record OrdenCompraDetalleDto(
    int Id, string Numero, string Proveedor, string? Observaciones, DateTime Fecha,
    EstadoOrden Estado, List<OrdenLineaDto> Lineas);
