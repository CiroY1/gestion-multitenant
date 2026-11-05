using Gestion.Api.Common;
using Gestion.Api.Data;
using Gestion.Api.Inventario;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gestion.Api.Documentos;

[Authorize]
[ApiController]
[Route("api/documentos")]
public class DocumentosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;
    private readonly PdfService _pdf;

    public DocumentosController(AppDbContext db, ITenantProvider tenant, PdfService pdf)
    {
        _db = db;
        _tenant = tenant;
        _pdf = pdf;
    }

    [HttpGet("recepciones/{id:int}/pdf")]
    public async Task<IActionResult> Recepcion(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Recepciones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .Include(x => x.OrdenCompra)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();

        var m = new DocumentoPdf
        {
            EmpresaNombre = await EmpresaNombreAsync(t),
            Titulo = "Recepción de mercancía",
            Numero = r.Numero,
            Estado = r.Estado.ToString(),
            Fecha = r.Fecha,
            TerceroLabel = "Proveedor",
            TerceroValor = r.Proveedor,
            Referencia = r.OrdenCompra?.Numero,
            Observaciones = r.Observaciones,
            ValorLabel = "Costo unit.",
            Lineas = r.Lineas.Select(l => new DocumentoPdfLinea(
                l.Producto?.Nombre ?? $"#{l.ProductoId}", l.Cantidad, l.CostoUnitario,
                l.Cantidad * l.CostoUnitario)).ToList(),
            Total = r.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
        };
        return Pdf(m);
    }

    [HttpGet("remisiones/{id:int}/pdf")]
    public async Task<IActionResult> Remision(int id)
    {
        var t = _tenant.GetTenantId();
        var r = await _db.Remisiones
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .Include(x => x.PedidoVenta)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (r is null) return NotFound();

        var m = new DocumentoPdf
        {
            EmpresaNombre = await EmpresaNombreAsync(t),
            Titulo = "Remisión de salida",
            Numero = r.Numero,
            Estado = r.Estado.ToString(),
            Fecha = r.Fecha,
            TerceroLabel = "Cliente",
            TerceroValor = r.Cliente,
            Referencia = r.PedidoVenta?.Numero,
            Observaciones = r.Observaciones,
            MostrarValores = false,
            Lineas = r.Lineas.Select(l => new DocumentoPdfLinea(
                l.Producto?.Nombre ?? $"#{l.ProductoId}", l.Cantidad, 0m, 0m)).ToList(),
        };
        return Pdf(m);
    }

    [HttpGet("ordenescompra/{id:int}/pdf")]
    public async Task<IActionResult> OrdenCompra(int id)
    {
        var t = _tenant.GetTenantId();
        var o = await _db.OrdenesCompra
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (o is null) return NotFound();

        var m = new DocumentoPdf
        {
            EmpresaNombre = await EmpresaNombreAsync(t),
            Titulo = "Orden de compra",
            Numero = o.Numero,
            Estado = o.Estado.ToString(),
            Fecha = o.Fecha,
            TerceroLabel = "Proveedor",
            TerceroValor = o.Proveedor,
            Observaciones = o.Observaciones,
            ValorLabel = "Costo unit.",
            Lineas = o.Lineas.Select(l => new DocumentoPdfLinea(
                l.Producto?.Nombre ?? $"#{l.ProductoId}", l.Cantidad, l.CostoUnitario,
                l.Cantidad * l.CostoUnitario)).ToList(),
            Total = o.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
        };
        return Pdf(m);
    }

    [HttpGet("pedidosventa/{id:int}/pdf")]
    public async Task<IActionResult> PedidoVenta(int id)
    {
        var t = _tenant.GetTenantId();
        var p = await _db.PedidosVenta
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (p is null) return NotFound();

        var m = new DocumentoPdf
        {
            EmpresaNombre = await EmpresaNombreAsync(t),
            Titulo = "Pedido de venta",
            Numero = p.Numero,
            Estado = p.Estado.ToString(),
            Fecha = p.Fecha,
            TerceroLabel = "Cliente",
            TerceroValor = p.Cliente,
            Observaciones = p.Observaciones,
            ValorLabel = "Precio unit.",
            Lineas = p.Lineas.Select(l => new DocumentoPdfLinea(
                l.Producto?.Nombre ?? $"#{l.ProductoId}", l.Cantidad, l.PrecioUnitario,
                l.Cantidad * l.PrecioUnitario)).ToList(),
            Total = p.Lineas.Sum(l => l.Cantidad * l.PrecioUnitario),
        };
        return Pdf(m);
    }

    [HttpGet("notas/{id:int}/pdf")]
    public async Task<IActionResult> Nota(int id)
    {
        var t = _tenant.GetTenantId();
        var n = await _db.Notas
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .Include(x => x.Remision)
            .Include(x => x.Recepcion)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (n is null) return NotFound();

        var m = new DocumentoPdf
        {
            EmpresaNombre = await EmpresaNombreAsync(t),
            Titulo = n.Tipo == TipoNota.Credito ? "Nota crédito" : "Nota débito",
            Numero = n.Numero,
            Estado = n.Estado.ToString(),
            Fecha = n.Fecha,
            TerceroLabel = "Documento origen",
            TerceroValor = n.Remision?.Numero ?? n.Recepcion?.Numero ?? "-",
            Observaciones = n.Motivo,
            ValorLabel = "Valor unit.",
            Lineas = n.Lineas.Select(l => new DocumentoPdfLinea(
                l.Producto?.Nombre ?? $"#{l.ProductoId}", l.Cantidad, l.CostoUnitario,
                l.Cantidad * l.CostoUnitario)).ToList(),
            Total = n.Lineas.Sum(l => l.Cantidad * l.CostoUnitario),
        };
        return Pdf(m);
    }

    [HttpGet("ajustes/{id:int}/pdf")]
    public async Task<IActionResult> Ajuste(int id)
    {
        var t = _tenant.GetTenantId();
        var a = await _db.Ajustes
            .Include(x => x.Lineas).ThenInclude(l => l.Producto)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == t);
        if (a is null) return NotFound();

        var m = new DocumentoPdf
        {
            EmpresaNombre = await EmpresaNombreAsync(t),
            Titulo = "Ajuste de inventario",
            Numero = a.Numero,
            Estado = a.Estado.ToString(),
            Fecha = a.Fecha,
            TerceroLabel = "Motivo",
            TerceroValor = a.Motivo,
            MostrarValores = false,
            Lineas = a.Lineas.Select(l => new DocumentoPdfLinea(
                $"{l.Producto?.Nombre ?? $"#{l.ProductoId}"} — {l.Tipo}", l.Cantidad, 0m, 0m)).ToList(),
        };
        return Pdf(m);
    }

    private IActionResult Pdf(DocumentoPdf m) =>
        File(_pdf.Generar(m), "application/pdf", $"{m.Numero}.pdf");

    private async Task<string> EmpresaNombreAsync(string t) =>
        await _db.Empresas.Where(e => e.Id == t).Select(e => e.Nombre).FirstOrDefaultAsync() ?? t;
}
