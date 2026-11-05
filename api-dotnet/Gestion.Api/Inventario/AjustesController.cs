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
public class AjustesController : ControllerBase
{
    private const string TipoDoc = "AJU";

    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;
    private readonly KardexService _kardex;

    public AjustesController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos, KardexService kardex)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
        _kardex = kardex;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AjusteDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Ajustes
            .Where(a => a.TenantId == t)
            .OrderByDescending(a => a.Fecha)
            .Select(a => new AjusteDto(a.Id, a.Numero, a.Motivo, a.Fecha, a.Estado, a.Lineas.Count))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AjusteDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var a = await CargarAsync(id, t);
        if (a is null) return NotFound();
        return Ok(Map(a));
    }

    [HttpPost]
    public async Task<ActionResult<AjusteDetalleDto>> Crear(CrearAjusteDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Motivo))
            return BadRequest("El motivo es obligatorio.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("El ajuste debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");

        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id).ToListAsync();
        if (ids.Any(id => !productos.Contains(id)))
            return BadRequest("Uno o más productos no existen.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        var ajuste = new Ajuste
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            Motivo = dto.Motivo.Trim(),
            Fecha = DateTime.UtcNow,
            Estado = EstadoDocumento.Borrador,
            TenantId = t,
        };
        foreach (var l in dto.Lineas)
        {
            ajuste.Lineas.Add(new AjusteLinea
            {
                ProductoId = l.ProductoId,
                Tipo = l.Tipo,
                Cantidad = l.Cantidad,
            });
        }

        _db.Ajustes.Add(ajuste);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        var creado = await CargarAsync(ajuste.Id, t);
        return CreatedAtAction(nameof(Obtener), new { id = ajuste.Id }, Map(creado!));
    }

    /// <summary>Confirma el ajuste: aplica cada línea (entrada suma, salida resta) al stock.</summary>
    [HttpPost("{id:int}/confirmar")]
    public async Task<ActionResult<AjusteDetalleDto>> Confirmar(int id)
    {
        var t = _tenant.GetTenantId();
        var a = await CargarAsync(id, t);
        if (a is null) return NotFound();
        if (a.Estado != EstadoDocumento.Borrador)
            return BadRequest("Solo se puede confirmar un ajuste en borrador.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var l in a.Lineas)
        {
            var res = await _kardex.MoverAsync(l.ProductoId, t, l.Tipo, l.Cantidad,
                null, TipoDoc, a.Numero, $"Ajuste: {a.Motivo}");
            if (!res.Ok)
            {
                await tx.RollbackAsync();
                return BadRequest($"Stock insuficiente de \"{l.Producto?.Nombre ?? $"#{l.ProductoId}"}\" para el ajuste.");
            }
        }

        a.Estado = EstadoDocumento.Confirmado;
        a.FechaConfirmacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(Map(a));
    }

    /// <summary>Anula el ajuste. Si estaba confirmado, revierte cada línea.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<AjusteDetalleDto>> Anular(int id)
    {
        var t = _tenant.GetTenantId();
        var a = await CargarAsync(id, t);
        if (a is null) return NotFound();
        if (a.Estado == EstadoDocumento.Anulado)
            return BadRequest("El ajuste ya está anulado.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        if (a.Estado == EstadoDocumento.Confirmado)
        {
            foreach (var l in a.Lineas)
            {
                // Revertir: una entrada se devuelve como salida y viceversa.
                var inverso = l.Tipo == TipoMovimiento.Entrada
                    ? TipoMovimiento.Salida
                    : TipoMovimiento.Entrada;
                var res = await _kardex.MoverAsync(l.ProductoId, t, inverso, l.Cantidad,
                    null, TipoDoc, a.Numero, $"Anulación de ajuste: {a.Motivo}");
                if (!res.Ok)
                {
                    await tx.RollbackAsync();
                    return BadRequest($"No se puede anular: el stock de \"{l.Producto?.Nombre ?? $"#{l.ProductoId}"}\" ya no alcanza para revertir.");
                }
            }
        }

        a.Estado = EstadoDocumento.Anulado;
        a.FechaAnulacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(Map(a));
    }

    private Task<Ajuste?> CargarAsync(int id, string t) => _db.Ajustes
        .Include(a => a.Lineas).ThenInclude(l => l.Producto)
        .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == t);

    private static AjusteDetalleDto Map(Ajuste a) => new(
        a.Id, a.Numero, a.Motivo, a.Fecha, a.Estado,
        a.Lineas.Select(l => new AjusteLineaDto(
            l.ProductoId, l.Producto?.Nombre, l.Tipo.ToString(), l.Cantidad)).ToList());
}
