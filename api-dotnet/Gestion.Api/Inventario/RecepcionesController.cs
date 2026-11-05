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
public class RecepcionesController : ControllerBase
{
    private const string TipoDoc = "REC";

    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;
    private readonly KardexService _kardex;

    public RecepcionesController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos, KardexService kardex)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
        _kardex = kardex;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecepcionDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Recepciones
            .Where(r => r.TenantId == t)
            .OrderByDescending(r => r.Fecha)
            .Select(r => new RecepcionDto(
                r.Id, r.Numero, r.Proveedor, r.Observaciones, r.Fecha, r.Estado,
                r.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
                r.Lineas.Count,
                r.OrdenCompra != null ? r.OrdenCompra.Numero : null))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecepcionDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recepciones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();

        return Ok(ToDetalle(r));
    }

    [HttpPost]
    public async Task<ActionResult<RecepcionDetalleDto>> Crear(CrearRecepcionDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Proveedor))
            return BadRequest("El proveedor es obligatorio.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("La recepción debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");
        if (dto.Lineas.Any(l => l.CostoUnitario < 0))
            return BadRequest("El costo unitario no puede ser negativo.");

        // Precarga de productos del tenant (evita N+1 y valida existencia).
        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id)
            .ToListAsync();
        if (ids.Any(id => !productos.Contains(id)))
            return BadRequest("Uno o más productos no existen.");

        // Si la recepción es contra una orden de compra, validar la orden y sus líneas.
        OrdenCompra? orden = null;
        if (dto.OrdenCompraId is int ocId)
        {
            orden = await _db.OrdenesCompra
                .Include(o => o.Lineas)
                .FirstOrDefaultAsync(o => o.Id == ocId && o.TenantId == t);
            if (orden is null) return BadRequest("La orden de compra no existe.");
            if (orden.Estado != EstadoOrden.Aprobada && orden.Estado != EstadoOrden.Parcial)
                return BadRequest("Solo se puede recibir contra una orden aprobada o parcial.");

            foreach (var l in dto.Lineas)
            {
                if (l.OrdenCompraLineaId is not int lineaId)
                    return BadRequest("Cada línea debe referenciar una línea de la orden.");
                var ol = orden.Lineas.FirstOrDefault(x => x.Id == lineaId);
                if (ol is null) return BadRequest("Una línea no pertenece a la orden indicada.");
                var pendiente = ol.Cantidad - ol.CantidadRecibida;
                if (l.Cantidad > pendiente)
                    return BadRequest($"No puedes recibir más de lo pendiente ({pendiente}) de \"{ol.Producto?.Nombre ?? $"#{ol.ProductoId}"}\".");
            }
        }

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Se crea como BORRADOR: no se mueve stock hasta confirmar.
        var recepcion = new Recepcion
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            Proveedor = dto.Proveedor,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            Estado = EstadoDocumento.Borrador,
            OrdenCompraId = orden?.Id,
            TenantId = t,
        };

        foreach (var l in dto.Lineas)
        {
            recepcion.Lineas.Add(new RecepcionLinea
            {
                ProductoId = l.ProductoId,
                Cantidad = l.Cantidad,
                CostoUnitario = l.CostoUnitario,
                OrdenCompraLineaId = l.OrdenCompraLineaId,
            });
        }

        _db.Recepciones.Add(recepcion);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return CreatedAtAction(nameof(Obtener), new { id = recepcion.Id }, ToDetalle(recepcion));
    }

    /// <summary>Confirma un borrador: suma el stock y genera los movimientos de entrada.</summary>
    [HttpPost("{id:int}/confirmar")]
    public async Task<ActionResult<RecepcionDetalleDto>> Confirmar(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recepciones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();
        if (r.Estado != EstadoDocumento.Borrador)
            return BadRequest("Solo se puede confirmar una recepción en borrador.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var l in r.Lineas)
        {
            // Entrada con costo de compra: actualiza el costo promedio del producto.
            await _kardex.MoverAsync(l.ProductoId, t, TipoMovimiento.Entrada, l.Cantidad,
                l.CostoUnitario, "REC", r.Numero, "Recepción de mercancía");
        }

        // Si viene de una orden de compra, acumular lo recibido y recalcular su estado.
        await ActualizarOrdenAsync(r, sumar: true);

        r.Estado = EstadoDocumento.Confirmado;
        r.FechaConfirmacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDetalle(r));
    }

    /// <summary>Anula la recepción. Si estaba confirmada, revierte el stock sumado.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<RecepcionDetalleDto>> Anular(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recepciones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();
        if (r.Estado == EstadoDocumento.Anulado)
            return BadRequest("La recepción ya está anulada.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Si estaba confirmada, revertir el stock que había sumado.
        if (r.Estado == EstadoDocumento.Confirmado)
        {
            foreach (var l in r.Lineas)
            {
                // Revertir la entrada: salida al costo promedio, con guardia de stock.
                var res = await _kardex.MoverAsync(l.ProductoId, t, TipoMovimiento.Salida, l.Cantidad,
                    null, "REC", r.Numero, "Anulación de recepción");
                if (!res.Ok)
                {
                    await tx.RollbackAsync();
                    var nombre = l.Producto?.Nombre ?? $"#{l.ProductoId}";
                    return BadRequest($"No se puede anular: el stock de \"{nombre}\" ya fue despachado.");
                }
            }

            // Revertir lo recibido en la orden de compra, si aplica.
            await ActualizarOrdenAsync(r, sumar: false);
        }

        r.Estado = EstadoDocumento.Anulado;
        r.FechaAnulacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDetalle(r));
    }

    /// <summary>
    /// Acumula (o revierte) en la orden de compra la cantidad recibida por esta
    /// recepción y recalcula su estado (aprobada / parcial / recibida).
    /// </summary>
    private async Task ActualizarOrdenAsync(Recepcion r, bool sumar)
    {
        if (r.OrdenCompraId is not int ocId) return;

        var orden = await _db.OrdenesCompra
            .Include(o => o.Lineas)
            .FirstOrDefaultAsync(o => o.Id == ocId);
        if (orden is null) return;

        foreach (var l in r.Lineas)
        {
            if (l.OrdenCompraLineaId is not int lineaId) continue;
            var ol = orden.Lineas.FirstOrDefault(x => x.Id == lineaId);
            if (ol is null) continue;
            ol.CantidadRecibida += sumar ? l.Cantidad : -l.Cantidad;
            if (ol.CantidadRecibida < 0) ol.CantidadRecibida = 0;
        }

        // No tocar órdenes cerradas o anuladas manualmente.
        if (orden.Estado is EstadoOrden.Cerrada or EstadoOrden.Anulada) return;

        orden.Estado = orden.Lineas.All(x => x.CantidadRecibida >= x.Cantidad)
            ? EstadoOrden.Recibida
            : orden.Lineas.Any(x => x.CantidadRecibida > 0)
                ? EstadoOrden.Parcial
                : EstadoOrden.Aprobada;
    }

    private static RecepcionDetalleDto ToDetalle(Recepcion r) => new(
        r.Id, r.Numero, r.Proveedor, r.Observaciones, r.Fecha, r.Estado,
        r.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
        r.Lineas.Select(l => new RecepcionLineaDto(
            l.ProductoId, l.Producto?.Nombre, l.Cantidad, l.CostoUnitario)).ToList());
}
