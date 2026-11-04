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

    public RemisionesController(AppDbContext db, ITenantProvider tenant, ConsecutivoService consecutivos)
    {
        _db = db;
        _tenant = tenant;
        _consecutivos = consecutivos;
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
                r.Lineas.Count))
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

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Se crea como BORRADOR: no se descuenta stock hasta confirmar.
        var remision = new Remision
        {
            Numero = await _consecutivos.SiguienteAsync(t, TipoDoc),
            Cliente = dto.Cliente,
            Observaciones = dto.Observaciones,
            Fecha = DateTime.UtcNow,
            Estado = EstadoDocumento.Borrador,
            TenantId = t,
        };

        foreach (var l in dto.Lineas)
        {
            remision.Lineas.Add(new RemisionLinea
            {
                ProductoId = l.ProductoId,
                Cantidad = l.Cantidad,
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
            // Resta de stock atómica con guardia: si no hay suficiente, afecta 0 filas.
            var filas = await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" - {l.Cantidad}
                   WHERE ""Id"" = {l.ProductoId} AND ""TenantId"" = {t} AND ""Stock"" >= {l.Cantidad}");
            if (filas == 0)
            {
                await tx.RollbackAsync();
                var nombre = l.Producto?.Nombre ?? $"#{l.ProductoId}";
                return BadRequest($"Stock insuficiente de \"{nombre}\".");
            }

            _db.MovimientosStock.Add(new MovimientoStock
            {
                ProductoId = l.ProductoId,
                Tipo = TipoMovimiento.Salida,
                Cantidad = l.Cantidad,
                Fecha = DateTime.UtcNow,
                TenantId = t,
            });
        }

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
                await _db.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE ""Productos"" SET ""Stock"" = ""Stock"" + {l.Cantidad}
                       WHERE ""Id"" = {l.ProductoId} AND ""TenantId"" = {t}");

                _db.MovimientosStock.Add(new MovimientoStock
                {
                    ProductoId = l.ProductoId,
                    Tipo = TipoMovimiento.Entrada,
                    Cantidad = l.Cantidad,
                    Fecha = DateTime.UtcNow,
                    TenantId = t,
                });
            }
        }

        r.Estado = EstadoDocumento.Anulado;
        r.FechaAnulacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(ToDetalle(r));
    }

    private static RemisionDetalleDto ToDetalle(Remision r) => new(
        r.Id, r.Numero, r.Cliente, r.Observaciones, r.Fecha, r.Estado,
        r.Lineas.Select(l => new RemisionLineaDto(
            l.ProductoId, l.Producto?.Nombre, l.Cantidad)).ToList());
}
