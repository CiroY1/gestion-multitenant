namespace Gestion.Api.Inventario.Dtos;

public record LoteDto(
    int Id, int ProductoId, string Producto, string Codigo, DateTime? FechaVencimiento, int Stock);
public record CrearLoteDto(int ProductoId, string Codigo, DateTime? FechaVencimiento);
