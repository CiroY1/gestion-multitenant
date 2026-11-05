namespace Gestion.Api.Inventario.Dtos;

// --- Categorías ---
public record CategoriaDto(int Id, string Nombre);
public record GuardarCategoriaDto(string Nombre);

// --- Productos ---
public record ProductoDto(
    int Id, string Nombre, string? Descripcion, decimal Precio, int Stock,
    decimal CostoPromedio, int CategoriaId, string? Categoria,
    int? UnidadMedidaId, string? Unidad);

public record CrearProductoDto(
    string Nombre, string? Descripcion, decimal Precio, int StockInicial, int CategoriaId,
    int? UnidadMedidaId = null);

public record ActualizarProductoDto(
    string Nombre, string? Descripcion, decimal Precio, int CategoriaId,
    int? UnidadMedidaId = null);

// --- Unidades de medida ---
public record UnidadMedidaDto(int Id, string Nombre, string Abreviatura);
public record GuardarUnidadDto(string Nombre, string Abreviatura);

// --- Movimientos de stock ---
public record MovimientoDto(int Id, int ProductoId, string Tipo, int Cantidad, DateTime Fecha);
public record CrearMovimientoDto(int ProductoId, TipoMovimiento Tipo, int Cantidad, int? BodegaId = null);

// --- Kardex ---
public record KardexLineaDto(
    DateTime Fecha, string? DocumentoTipo, string? DocumentoNumero, string? Concepto,
    string? Bodega, int Entrada, int Salida, decimal CostoUnitario, int SaldoCantidad,
    decimal CostoPromedio, decimal SaldoValor);

public record KardexDto(
    int ProductoId, string Producto, int Stock, decimal CostoPromedio, decimal Valor,
    List<KardexLineaDto> Movimientos);
