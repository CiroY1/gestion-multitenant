namespace Gestion.Api.Inventario;

/// <summary>Categoría de productos (p. ej. Bebidas, Snacks).</summary>
public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Empresa (tenant) dueña del registro. Aísla los datos por empresa.</summary>
    public string TenantId { get; set; } = string.Empty;

    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
