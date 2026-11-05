using Gestion.Api.Common;
using Gestion.Api.Data;
using Gestion.Api.Inventario.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Inventario;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public ProductosController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Productos
            .Where(p => p.TenantId == t)
            .OrderBy(p => p.Nombre)
            .Select(p => new ProductoDto(
                p.Id, p.Nombre, p.Descripcion, p.Precio, p.Stock, p.CostoPromedio,
                p.CategoriaId, p.Categoria!.Nombre))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductoDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var p = await _db.Productos.Include(x => x.Categoria)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        return p is null
            ? NotFound()
            : Ok(new ProductoDto(p.Id, p.Nombre, p.Descripcion, p.Precio, p.Stock,
                p.CostoPromedio, p.CategoriaId, p.Categoria?.Nombre));
    }

    [HttpPost]
    public async Task<ActionResult<ProductoDto>> Crear(CrearProductoDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest("El nombre es obligatorio.");
        if (dto.Precio < 0)
            return BadRequest("El precio no puede ser negativo.");
        if (dto.StockInicial < 0)
            return BadRequest("El stock inicial no puede ser negativo.");

        var categoriaOk = await _db.Categorias.AnyAsync(c => c.Id == dto.CategoriaId && c.TenantId == t);
        if (!categoriaOk) return BadRequest("La categoría indicada no existe.");

        var producto = new Producto
        {
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion,
            Precio = dto.Precio,
            Stock = dto.StockInicial,
            CategoriaId = dto.CategoriaId,
            TenantId = t,
        };
        _db.Productos.Add(producto);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Obtener), new { id = producto.Id },
            new ProductoDto(producto.Id, producto.Nombre, producto.Descripcion,
                producto.Precio, producto.Stock, producto.CostoPromedio, producto.CategoriaId, null));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, ActualizarProductoDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest("El nombre es obligatorio.");
        if (dto.Precio < 0)
            return BadRequest("El precio no puede ser negativo.");

        var p = await _db.Productos.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (p is null) return NotFound();

        var categoriaOk = await _db.Categorias.AnyAsync(c => c.Id == dto.CategoriaId && c.TenantId == t);
        if (!categoriaOk) return BadRequest("La categoría indicada no existe.");

        p.Nombre = dto.Nombre.Trim();
        p.Descripcion = dto.Descripcion;
        p.Precio = dto.Precio;
        p.CategoriaId = dto.CategoriaId;
        // El stock NO se edita aquí: cambia solo con movimientos.
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var t = _tenant.GetTenantId();
        var p = await _db.Productos.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (p is null) return NotFound();

        // Protege el historial: no se elimina un producto con movimientos o documentos.
        var tieneHistorial =
            await _db.MovimientosStock.AnyAsync(m => m.ProductoId == id && m.TenantId == t) ||
            await _db.RecepcionLineas.AnyAsync(l => l.ProductoId == id) ||
            await _db.RemisionLineas.AnyAsync(l => l.ProductoId == id) ||
            await _db.RecetaIngredientes.AnyAsync(i => i.ProductoId == id) ||
            await _db.Recetas.AnyAsync(r => r.ProductoFinalId == id && r.TenantId == t);
        if (tieneHistorial)
            return BadRequest("No se puede eliminar: el producto tiene movimientos o documentos asociados.");

        _db.Productos.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
