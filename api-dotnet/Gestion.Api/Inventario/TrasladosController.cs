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
public class TrasladosController : ControllerBase
{
    private const string TipoDoc = "TR";

    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;
    private readonly KardexService _kardex;

    public TrasladosController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos, KardexService kardex)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
        _kardex = kardex;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TrasladoDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Traslados
            .Where(x => x.TenantId == t)
            .OrderByDescending(x => x.Fecha)
            .Select(x => new TrasladoDto(
                x.Id, x.Numero, x.BodegaOrigen!.Nombre, x.BodegaDestino!.Nombre,
                x.Fecha, x.Estado, x.Lineas.Count))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TrasladoDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var x = await CargarAsync(id, t);
        if (x is null) return NotFound();
        return Ok(Map(x));
    }

    [HttpPost]
    public async Task<ActionResult<TrasladoDetalleDto>> Crear(CrearTrasladoDto dto)
    {
        var t = _tenant.GetTenantId();

        if (dto.BodegaOrigenId == dto.BodegaDestinoId)
            return BadRequest("La bodega origen y destino deben ser distintas.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("El traslado debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");

        var bodegasOk = await _db.Bodegas
            .CountAsync(b => b.TenantId == t && (b.Id == dto.BodegaOrigenId || b.Id == dto.BodegaDestinoId));
        if (bodegasOk < 2) return BadRequest("Bodega origen o destino inválida.");

        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id).ToListAsync();
        if (ids.Any(id => !productos.Contains(id)))
            return BadRequest("Uno o más productos no existen.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        var traslado = new Traslado
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            BodegaOrigenId = dto.BodegaOrigenId,
            BodegaDestinoId = dto.BodegaDestinoId,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            Estado = EstadoDocumento.Borrador,
            TenantId = t,
        };
        foreach (var l in dto.Lineas)
            traslado.Lineas.Add(new TrasladoLinea { ProductoId = l.ProductoId, Cantidad = l.Cantidad });

        _db.Traslados.Add(traslado);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        var creado = await CargarAsync(traslado.Id, t);
        return CreatedAtAction(nameof(Obtener), new { id = traslado.Id }, Map(creado!));
    }

    /// <summary>Confirma el traslado: resta de la bodega origen y suma a la destino.</summary>
    [HttpPost("{id:int}/confirmar")]
    public async Task<ActionResult<TrasladoDetalleDto>> Confirmar(int id)
    {
        var t = _tenant.GetTenantId();
        var x = await CargarAsync(id, t);
        if (x is null) return NotFound();
        if (x.Estado != EstadoDocumento.Borrador)
            return BadRequest("Solo se puede confirmar un traslado en borrador.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var l in x.Lineas)
        {
            var salida = await _kardex.MoverAsync(l.ProductoId, t, x.BodegaOrigenId, TipoMovimiento.Salida,
                l.Cantidad, null, TipoDoc, x.Numero, $"Traslado a {x.BodegaDestino?.Nombre}");
            if (!salida.Ok)
            {
                await tx.RollbackAsync();
                return BadRequest($"Stock insuficiente de \"{l.Producto?.Nombre ?? $"#{l.ProductoId}"}\" en {x.BodegaOrigen?.Nombre}.");
            }
            await _kardex.MoverAsync(l.ProductoId, t, x.BodegaDestinoId, TipoMovimiento.Entrada,
                l.Cantidad, null, TipoDoc, x.Numero, $"Traslado desde {x.BodegaOrigen?.Nombre}");
        }

        x.Estado = EstadoDocumento.Confirmado;
        x.FechaConfirmacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(Map(x));
    }

    /// <summary>Anula el traslado. Si estaba confirmado, devuelve la mercancía a la bodega origen.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<TrasladoDetalleDto>> Anular(int id)
    {
        var t = _tenant.GetTenantId();
        var x = await CargarAsync(id, t);
        if (x is null) return NotFound();
        if (x.Estado == EstadoDocumento.Anulado)
            return BadRequest("El traslado ya está anulado.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        if (x.Estado == EstadoDocumento.Confirmado)
        {
            foreach (var l in x.Lineas)
            {
                // Revertir: sacar de destino (con guardia) y devolver a origen.
                var salida = await _kardex.MoverAsync(l.ProductoId, t, x.BodegaDestinoId, TipoMovimiento.Salida,
                    l.Cantidad, null, TipoDoc, x.Numero, $"Anulación de traslado (devuelve a {x.BodegaOrigen?.Nombre})");
                if (!salida.Ok)
                {
                    await tx.RollbackAsync();
                    return BadRequest($"No se puede anular: el stock de \"{l.Producto?.Nombre ?? $"#{l.ProductoId}"}\" en {x.BodegaDestino?.Nombre} ya no alcanza.");
                }
                await _kardex.MoverAsync(l.ProductoId, t, x.BodegaOrigenId, TipoMovimiento.Entrada,
                    l.Cantidad, null, TipoDoc, x.Numero, "Anulación de traslado");
            }
        }

        x.Estado = EstadoDocumento.Anulado;
        x.FechaAnulacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(Map(x));
    }

    private Task<Traslado?> CargarAsync(int id, string t) => _db.Traslados
        .Include(x => x.BodegaOrigen)
        .Include(x => x.BodegaDestino)
        .Include(x => x.Lineas).ThenInclude(l => l.Producto)
        .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);

    private static TrasladoDetalleDto Map(Traslado x) => new(
        x.Id, x.Numero, x.BodegaOrigen?.Nombre ?? "", x.BodegaDestino?.Nombre ?? "",
        x.Observaciones, x.Fecha, x.Estado,
        x.Lineas.Select(l => new TrasladoLineaDto(l.ProductoId, l.Producto?.Nombre, l.Cantidad)).ToList());
}
