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
public class KardexController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public KardexController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    /// <summary>Tarjeta de kardex de un producto: movimientos en orden, con saldo y valor corridos.</summary>
    [HttpGet("{productoId:int}")]
    public async Task<ActionResult<KardexDto>> Obtener(int productoId)
    {
        var t = _tenant.GetTenantId();
        var p = await _db.Productos
            .FirstOrDefaultAsync(x => x.Id == productoId && x.TenantId == t);
        if (p is null) return NotFound();

        var movimientos = await _db.MovimientosStock
            .Where(m => m.TenantId == t && m.ProductoId == productoId)
            .OrderBy(m => m.Fecha).ThenBy(m => m.Id)
            .Select(m => new KardexLineaDto(
                m.Fecha, m.DocumentoTipo, m.DocumentoNumero, m.Concepto,
                m.Tipo == TipoMovimiento.Entrada ? m.Cantidad : 0,
                m.Tipo == TipoMovimiento.Salida ? m.Cantidad : 0,
                m.CostoUnitario, m.SaldoCantidad, m.CostoPromedio,
                m.SaldoCantidad * m.CostoPromedio))
            .ToListAsync();

        return Ok(new KardexDto(
            p.Id, p.Nombre, p.Stock, p.CostoPromedio, p.Stock * p.CostoPromedio, movimientos));
    }
}
