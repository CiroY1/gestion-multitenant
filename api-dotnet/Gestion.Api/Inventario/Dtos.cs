namespace Gestion.Api.Inventario.Dtos;

// --- Categorías ---
public record CategoriaDto(int Id, string Nombre);
public record GuardarCategoriaDto(string Nombre);

// --- Productos ---
public record ProductoDto(
    int Id, string Nombre, string? Descripcion, decimal Precio, int Stock,
    int CategoriaId, string? Categoria);

public record CrearProductoDto(
    string Nombre, string? Descripcion, decimal Precio, int StockInicial, int CategoriaId);

public record ActualizarProductoDto(
    string Nombre, string? Descripcion, decimal Precio, int CategoriaId);

// --- Movimientos de stock ---
public record MovimientoDto(int Id, int ProductoId, string Tipo, int Cantidad, DateTime Fecha);
public record CrearMovimientoDto(int ProductoId, TipoMovimiento Tipo, int Cantidad);
