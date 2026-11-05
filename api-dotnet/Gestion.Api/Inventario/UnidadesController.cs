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
public class UnidadesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenant;

    public UnidadesController(AppDbContext db, ITenantProvider tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UnidadMedidaDto>>> Listar()
    {
        var t = _tenant.GetTenantId();
        var items = await _db.UnidadesMedida
            .Where(u => u.TenantId == t)
            .OrderBy(u => u.Nombre)
            .Select(u => new UnidadMedidaDto(u.Id, u.Nombre, u.Abreviatura))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<UnidadMedidaDto>> Crear(GuardarUnidadDto dto)
    {
        var t = _tenant.GetTenantId();
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest("El nombre es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Abreviatura))
            return BadRequest("La abreviatura es obligatoria.");

        var u = new UnidadMedida
        {
            Nombre = dto.Nombre.Trim(),
            Abreviatura = dto.Abreviatura.Trim(),
            TenantId = t,
        };
        _db.UnidadesMedida.Add(u);
        await _db.SaveChangesAsync();
        return Ok(new UnidadMedidaDto(u.Id, u.Nombre, u.Abreviatura));
    }
}
