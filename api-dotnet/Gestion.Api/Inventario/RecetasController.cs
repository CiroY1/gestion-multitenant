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
public class RecetasController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly KardexService _kardex;

    public RecetasController(AppDbContext db, ITenantProvider tenant, KardexService kardex)
    {
        _db = db;
        _tenant = tenant;
        _kardex = kardex;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecetaDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Recetas
            .Where(r => r.TenantId == t)
            .OrderBy(r => r.Nombre)
            .Select(r => new RecetaDto(
                r.Id, r.Nombre, r.ProductoFinalId, r.ProductoFinal!.Nombre,
                r.Ingredientes.Count))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecetaDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recetas
            .Include(x => x.ProductoFinal)
            .Include(x => x.Ingredientes).ThenInclude(i => i.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();

        return Ok(new RecetaDetalleDto(
            r.Id, r.Nombre, r.ProductoFinalId, r.ProductoFinal?.Nombre,
            r.Ingredientes.Select(i => new RecetaIngredienteDto(
                i.ProductoId, i.Producto!.Nombre, i.Cantidad)).ToList()));
    }

    [HttpPost]
    public async Task<ActionResult<RecetaDetalleDto>> Crear(CrearRecetaDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest("El nombre de la receta es obligatorio.");
        if (dto.Ingredientes is null || dto.Ingredientes.Count == 0)
            return BadRequest("La receta debe tener al menos un insumo.");
        if (dto.Ingredientes.Any(i => i.Cantidad <= 0))
            return BadRequest("Las cantidades de los insumos deben ser mayores a 0.");

        // El producto final y todos los insumos deben existir en el tenant.
        var idsNecesarios = dto.Ingredientes.Select(i => i.ProductoId)
            .Append(dto.ProductoFinalId).Distinct().ToList();
        var existentes = await _db.Productos
            .Where(p => idsNecesarios.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id)
            .ToListAsync();
        if (idsNecesarios.Any(id => !existentes.Contains(id)))
            return BadRequest("El producto final o alguno de los insumos no existe.");

        var receta = new Receta
        {
            Nombre = dto.Nombre.Trim(),
            ProductoFinalId = dto.ProductoFinalId,
            TenantId = t,
            Ingredientes = dto.Ingredientes
                .Select(i => new RecetaIngrediente { ProductoId = i.ProductoId, Cantidad = i.Cantidad })
                .ToList(),
        };
        _db.Recetas.Add(receta);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Obtener), new { id = receta.Id },
            new RecetaDetalleDto(receta.Id, receta.Nombre, receta.ProductoFinalId, null,
                receta.Ingredientes.Select(i => new RecetaIngredienteDto(
                    i.ProductoId, null, i.Cantidad)).ToList()));
    }

    /// <summary>Produce N unidades: resta insumos (según receta) y suma el producto terminado.</summary>
    [HttpPost("{id:int}/producir")]
    public async Task<IActionResult> Producir(int id, ProducirDto dto)
    {
        var t = _tenant.GetTenantId();
        if (dto.Cantidad <= 0) return BadRequest("La cantidad a producir debe ser mayor a 0.");

        var receta = await _db.Recetas
            .Include(r => r.Ingredientes)
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == t);
        if (receta is null) return NotFound("La receta no existe.");
        if (receta.Ingredientes.Count == 0) return BadRequest("La receta no tiene insumos.");

        var nombres = await _db.Productos
            .Where(p => p.TenantId == t)
            .ToDictionaryAsync(p => p.Id, p => p.Nombre);

        var bodega = await _kardex.ResolverBodegaAsync(t, dto.BodegaId);
        if (bodega is null) return BadRequest("Bodega inválida o no hay bodegas registradas.");
        var bod = bodega.Value;

        await using var tx = await _db.Database.BeginTransactionAsync();

        decimal costoTotal = 0m;
        foreach (var ing in receta.Ingredientes)
        {
            var requerido = ing.Cantidad * dto.Cantidad;

            // Consumo del insumo: salida al costo promedio, con guardia de stock.
            var res = await _kardex.MoverAsync(ing.ProductoId, t, bod, TipoMovimiento.Salida, requerido,
                null, "PROD", null, $"Consumo producción: {receta.Nombre}");
            if (!res.Ok)
            {
                var nombre = nombres.TryGetValue(ing.ProductoId, out var n) ? n : ing.ProductoId.ToString();
                return BadRequest($"Insumo insuficiente: \"{nombre}\" (se requieren {requerido}).");
            }
            costoTotal += res.CostoMovimiento * requerido;
        }

        // Producto terminado: entra con el costo de los insumos consumidos.
        var costoUnitario = dto.Cantidad > 0 ? costoTotal / dto.Cantidad : 0m;
        await _kardex.MoverAsync(receta.ProductoFinalId, t, bod, TipoMovimiento.Entrada, dto.Cantidad,
            costoUnitario, "PROD", null, $"Producción: {receta.Nombre}");

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { mensaje = $"Se produjeron {dto.Cantidad} unidad(es).", producidas = dto.Cantidad });
    }
}
