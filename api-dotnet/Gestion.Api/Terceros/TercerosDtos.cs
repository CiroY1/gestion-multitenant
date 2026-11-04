namespace Gestion.Api.Terceros.Dtos;

public record ProveedorDto(int Id, string Nombre, string? Nit, string? Telefono, string? Email);
public record GuardarProveedorDto(string Nombre, string? Nit, string? Telefono, string? Email);

public record ClienteDto(int Id, string Nombre, string? Documento, string? Telefono, string? Email);
public record GuardarClienteDto(string Nombre, string? Documento, string? Telefono, string? Email);
