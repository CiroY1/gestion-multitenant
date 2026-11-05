namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearRecepcionLineaDto(int ProductoId, int Cantidad, decimal CostoUnitario, int? OrdenCompraLineaId = null);
public record CrearRecepcionDto(string Proveedor, string? Observaciones, List<CrearRecepcionLineaDto> Lineas, int? OrdenCompraId = null);

// Salida
public record RecepcionDto(
    int Id, string Numero, string Proveedor, string? Observaciones, DateTime Fecha,
    EstadoDocumento Estado, decimal Total, int Items, string? OrdenCompra);
public record RecepcionLineaDto(int ProductoId, string? Producto, int Cantidad, decimal CostoUnitario);
public record RecepcionDetalleDto(
    int Id, string Numero, string Proveedor, string? Observaciones, DateTime Fecha,
    EstadoDocumento Estado, decimal Total, List<RecepcionLineaDto> Lineas);
