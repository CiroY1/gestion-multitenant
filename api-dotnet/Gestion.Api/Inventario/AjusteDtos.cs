namespace Gestion.Api.Inventario.Dtos;

// Entrada
public record CrearAjusteLineaDto(int ProductoId, TipoMovimiento Tipo, int Cantidad);
public record CrearAjusteDto(string Motivo, List<CrearAjusteLineaDto> Lineas);

// Salida
public record AjusteLineaDto(int ProductoId, string? Producto, string Tipo, int Cantidad);
public record AjusteDto(
    int Id, string Numero, string Motivo, DateTime Fecha, EstadoDocumento Estado, int Items);
public record AjusteDetalleDto(
    int Id, string Numero, string Motivo, DateTime Fecha, EstadoDocumento Estado,
    List<AjusteLineaDto> Lineas);
