namespace Gestion.Api.Inventario;

/// <summary>
/// Receta (composición) de un producto terminado a partir de insumos.
/// Al "producir", se restan los insumos y se suma el producto terminado.
/// </summary>
public class Receta
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Producto que resulta de la producción.</summary>
    public int ProductoFinalId { get; set; }
    public Producto? ProductoFinal { get; set; }

    public string TenantId { get; set; } = string.Empty;

    public ICollection<RecetaIngrediente> Ingredientes { get; set; } = new List<RecetaIngrediente>();
}

/// <summary>Insumo de una receta: un producto y la cantidad que consume por unidad producida.</summary>
public class RecetaIngrediente
{
    public int Id { get; set; }

    public int RecetaId { get; set; }
    public Receta? Receta { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int Cantidad { get; set; }
}
