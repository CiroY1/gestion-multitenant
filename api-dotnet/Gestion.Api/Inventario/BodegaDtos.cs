namespace Gestion.Api.Inventario.Dtos;

public record BodegaDto(int Id, string Nombre, string? Codigo, bool Activa);
public record GuardarBodegaDto(string Nombre, string? Codigo, bool Activa);
public record ExistenciaDto(int ProductoId, string Producto, int BodegaId, string Bodega, int Stock);
