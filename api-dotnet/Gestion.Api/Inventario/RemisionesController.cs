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
public class RemisionesController : ControllerBase
{
    private const string TipoDoc = "REM";

    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly ConsecutivoService _consecutivos;
    private readonly KardexService _kardex;

    public RemisionesController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos, KardexService kardex)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
        _kardex = kardex;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RemisionDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.Remisiones
            .Where(r => r.TenantId == t)
            .OrderByDescending(r => r.Fecha)
            .Select(r => new RemisionDto(
                r.Id, r.Numero, r.Cliente, r.Observaciones, r.Fecha, r.Estado,
                r.Lineas.Sum(l => l.Cantidad),
                r.Lineas.Count,
                r.PedidoVenta != null ? r.PedidoVenta.Numero : null))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RemisionDetalleDto>> Obtener(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Remisiones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();

        return Ok(ToDetalle(r));
    }

    [HttpPost]
    public async Task<ActionResult<RemisionDetalleDto>> Crear(CrearRemisionDto dto)
    {
        var t = _tenant.GetTenantId();

        if (string.IsNullOrWhiteSpace(dto.Cliente))
            return BadRequest("El cliente es obligatorio.");
        if (dto.Lineas is null || dto.Lineas.Count == 0)
            return BadRequest("La remisión debe tener al menos una línea.");
        if (dto.Lineas.Any(l => l.Cantidad <= 0))
            return BadRequest("Las cantidades deben ser mayores a 0.");

        // Precarga de productos del tenant (evita N+1 y valida existencia).
        var ids = dto.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
            .Where(p => ids.Contains(p.Id) && p.TenantId == t)
            .Select(p => p.Id)
            .ToListAsync();
        if (ids.Any(id => !productos.Contains(id)))
            return BadRequest("Uno o más productos no existen.");

        // Si la remisión es contra un pedido de venta, validar el pedido y sus líneas.
        PedidoVenta? pedido = null;
        if (dto.PedidoVentaId is int pvId)
        {
            pedido = await _db.PedidosVenta
                .Include(p => p.Lineas).ThenInclude(l => l.Producto)
                .FirstOrDefaultAsync(p => p.Id == pvId && p.TenantId == t);
            if (pedido is null) return BadRequest("El pedido de venta no existe.");
            if (pedido.Estado != EstadoPedido.Aprobado && pedido.Estado != EstadoPedido.Parcial)
                return BadRequest("Solo se puede despachar contra un pedido aprobado o parcial.");

            foreach (var l in dto.Lineas)
            {
                if (l.PedidoVentaLineaId is not int lineaId)
                    return BadRequest("Cada línea debe referenciar una línea del pedido.");
                var pl = pedido.Lineas.FirstOrDefault(x => x.Id == lineaId);
                if (pl is null) return BadRequest("Una línea no pertenece al pedido indicado.");
                var pendiente = pl.Cantidad - pl.CantidadDespachada;
                if (l.Cantidad > pendiente)
                    return BadRequest($"No puedes despachar más de lo pendiente ({pendiente}) de \"{pl.Producto?.Nombre ?? $"#{pl.ProductoId}"}\".");
            }
        }

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Se crea como BORRADOR: no se descuenta stock hasta confirmar.
        var remision = new Remision
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            Cliente = dto.Cliente,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            Estado = EstadoDocumento.Borrador,
            PedidoVentaId = pedido?.Id,
            TenantId = t,
        };

        foreach (var l in dto.Lineas)
        {
            remision.Lineas.Add(new RemisionLinea
            {
                ProductoId = l.ProductoId,
                Cantidad = l.Cantidad,
                PedidoVentaLineaId = l.PedidoVentaLineaId,
            });
        }

        _db.Remisiones.Add(remision);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return CreatedAtAction(nameof(Obtener), new { id = remision.Id }, ToDetalle(remision));
    }

    /// <summary>Confirma un borrador: descuenta el stock y genera los movimientos de salida.</summary>
    [HttpPost("{id:int}/confirmar")]
    public async Task<ActionResult<RemisionDetalleDto>> Confirmar(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Remisiones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();
        if (r.Estado != EstadoDocumento.Borrador)
            return BadRequest("Solo se puede confirmar una remisión en borrador.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        foreach (var l in r.Lineas)
        {
            // Salida al costo promedio, con guardia de stock suficiente.
            var res = await _kardex.MoverAsync(l.ProductoId, t, TipoMovimiento.Salida, l.Cantidad,
                null, "REM", r.Numero, "Remisión de salida");
            if (!res.Ok)
            {
                await tx.RollbackAsync();
                var nombre = l.Producto?.Nombre ?? $"#{l.ProductoId}";
                return BadRequest($"Stock insuficiente de \"{nombre}\".");
            }
        }

        // Si viene de un pedido de venta, acumular lo despachado y recalcular su estado.
        await ActualizarPedidoAsync(r, sumar: true);

        r.Estado = EstadoDocumento.Confirmado;
        r.FechaConfirmacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDetalle(r));
    }

    /// <summary>Anula la remisión. Si estaba confirmada, devuelve el stock descontado.</summary>
    [HttpPost("{id:int}/anular")]
    public async Task<ActionResult<RemisionDetalleDto>> Anular(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Remisiones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();
        if (r.Estado == EstadoDocumento.Anulado)
            return BadRequest("La remisión ya está anulada.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Si estaba confirmada, devolver al stock lo que había descontado.
        if (r.Estado == EstadoDocumento.Confirmado)
        {
            foreach (var l in r.Lineas)
            {
                // Revertir la salida: entrada al costo promedio (devuelve el stock).
                await _kardex.MoverAsync(l.ProductoId, t, TipoMovimiento.Entrada, l.Cantidad,
                    null, "REM", r.Numero, "Anulación de remisión");
            }

            // Revertir lo despachado en el pedido de venta, si aplica.
            await ActualizarPedidoAsync(r, sumar: false);
        }

        r.Estado = EstadoDocumento.Anulado;
        r.FechaAnulacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDetalle(r));
    }

    /// <summary>
    /// Acumula (o revierte) en el pedido de venta la cantidad despachada por esta
    /// remisión y recalcula su estado (aprobado / parcial / despachado).
    /// </summary>
    private async Task ActualizarPedidoAsync(Remision r, bool sumar)
    {
        if (r.PedidoVentaId is not int pvId) return;

        var pedido = await _db.PedidosVenta
            .Include(p => p.Lineas)
            .FirstOrDefaultAsync(p => p.Id == pvId);
        if (pedido is null) return;

        foreach (var l in r.Lineas)
        {
            if (l.PedidoVentaLineaId is not int lineaId) continue;
            var pl = pedido.Lineas.FirstOrDefault(x => x.Id == lineaId);
            if (pl is null) continue;
            pl.CantidadDespachada += sumar ? l.Cantidad : -l.Cantidad;
            if (pl.CantidadDespachada < 0) pl.CantidadDespachada = 0;
        }

        // No tocar pedidos cerrados o anulados manualmente.
        if (pedido.Estado is EstadoPedido.Cerrado or EstadoPedido.Anulado) return;

        pedido.Estado = pedido.Lineas.All(x => x.CantidadDespachada >= x.Cantidad)
            ? EstadoPedido.Despachado
            : pedido.Lineas.Any(x => x.CantidadDespachada > 0)
                ? EstadoPedido.Parcial
                : EstadoPedido.Aprobado;
    }

    private static RemisionDetalleDto ToDetalle(Remision r) => new(
        r.Id, r.Numero, r.Cliente, r.Observaciones, r.Fecha, r.Estado,
        r.Lineas.Select(l => new RemisionLineaDto(
            l.ProductoId, l.Producto?.Nombre, l.Cantidad)).ToList());
}
