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
public class LotesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public LotesController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    /// <summary>Lotes con su vencimiento y stock total (suma de existencias por bodega).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LoteDto>>> Listar([FromQuery] int? productoId)
    {
        var t = _tenant.GetTenantId();
        var q = _db.Lotes.Where(l => l.TenantId == t);
        if (productoId is not null) q = q.Where(l => l.ProductoId == productoId);

        var items = await q
            .OrderBy(l => l.FechaVencimiento == null).ThenBy(l => l.FechaVencimiento)
            .Select(l => new LoteDto(
                l.Id, l.ProductoId, l.Producto!.Nombre, l.Codigo, l.FechaVencimiento,
                _db.ExistenciaLotes.Where(e => e.LoteId == l.Id).Sum(e => (int?)e.Stock) ?? 0))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<LoteDto>> Crear(CrearLoteDto dto)
    {
        var t = _tenant.GetTenantId();
        if (string.IsNullOrWhiteSpace(dto.Codigo))
            return BadRequest("El código del lote es obligatorio.");

        var prod = await _db.Productos.FirstOrDefaultAsync(p => p.Id == dto.ProductoId && p.TenantId == t);
        if (prod is null) return BadRequest("El producto no existe.");

        var dup = await _db.Lotes.AnyAsync(l =>
            l.TenantId == t && l.ProductoId == dto.ProductoId && l.Codigo == dto.Codigo.Trim());
        if (dup) return BadRequest("Ya existe un lote con ese código para el producto.");

        var lote = new Lote
        {
            ProductoId = dto.ProductoId,
            Codigo = dto.Codigo.Trim(),
            // La fecha llega como fecha simple; se guarda como UTC (requisito de Npgsql).
            FechaVencimiento = dto.FechaVencimiento.HasValue
                ? DateTime.SpecifyKind(dto.FechaVencimiento.Value.Date, DateTimeKind.Utc)
                : null,
            TenantId = t,
        };
        _db.Lotes.Add(lote);
        await _db.SaveChangesAsync();
        return Ok(new LoteDto(lote.Id, lote.ProductoId, prod.Nombre, lote.Codigo, lote.FechaVencimiento, 0));
    }
}
