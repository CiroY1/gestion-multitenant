namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearRecetaIngredienteDto(int ProductoId, int Cantidad);
public record CrearRecetaDto(string Nombre, int ProductoFinalId, List<CrearRecetaIngredienteDto> Ingredientes);
public record ProducirDto(int Cantidad, int? BodegaId = null);

// Salida
public record RecetaDto(int Id, string Nombre, int ProductoFinalId, string? ProductoFinal, int Ingredientes);
public record RecetaIngredienteDto(int ProductoId, string? Producto, int Cantidad);
public record RecetaDetalleDto(
    int Id, string Nombre, int ProductoFinalId, string? ProductoFinal,
    List<RecetaIngredienteDto> Ingredientes);
