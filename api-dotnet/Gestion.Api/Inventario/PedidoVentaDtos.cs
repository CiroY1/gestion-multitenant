namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearPedidoLineaDto(int ProductoId, int Cantidad, decimal PrecioUnitario);
public record CrearPedidoVentaDto(string Cliente, string? Observaciones, List<CrearPedidoLineaDto> Lineas);

// Salida
public record PedidoVentaDto(
    int Id, string Numero, string Cliente, string? Observaciones, DateTime Fecha,
    EstadoPedido Estado, decimal Total, int Items, int Pendiente);

public record PedidoLineaDto(
    int LineaId, int ProductoId, string? Producto, int Cantidad, decimal PrecioUnitario,
    int Despachada, int Pendiente);

public record PedidoVentaDetalleDto(
    int Id, string Numero, string Cliente, string? Observaciones, DateTime Fecha,
    EstadoPedido Estado, List<PedidoLineaDto> Lineas);
