import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { Db } from '../database/db.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { ModSpaGuard } from './mod-spa.guard'

/**
 * Reportes del spa: indicadores agregados para un panel. Todo se calcula en la
 * base (una consulta por bloque) y se filtra por tenant.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard)
@Controller('spa/reportes')
export class ReportesController {
  constructor(private readonly pool: Db) {}

  @Get('resumen')
  async resumen(@CurrentUser() u: UsuarioJwt) {
    const t = u.tenantId

    const citas = await this.pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE "Estado" = 'Programada')::int AS programadas,
              count(*) FILTER (WHERE "Estado" = 'Atendida')::int AS atendidas,
              count(*) FILTER (WHERE "Estado" = 'Cancelada')::int AS canceladas,
              count(*) FILTER (WHERE "Estado" = 'Programada' AND "FechaHora" > now())::int AS proximas
         FROM "SpaCitas" WHERE "TenantId" = $1`,
      [t],
    )

    const servicios = await this.pool.query(
      `SELECT count(*)::int AS n FROM "SpaServicios" WHERE "TenantId" = $1 AND "Activo"`,
      [t],
    )
    const trabajadores = await this.pool.query(
      `SELECT count(*)::int AS n FROM "SpaTrabajadores" WHERE "TenantId" = $1 AND "Activo"`,
      [t],
    )

    const bebes = await this.pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (
                WHERE (current_date - "FechaNacimiento") BETWEEN 14 AND 365
              )::int AS elegibles
         FROM "SpaBebes" WHERE "TenantId" = $1`,
      [t],
    )

    const eventos = await this.pool.query(
      `SELECT (SELECT count(*)::int FROM "SpaEventos" WHERE "TenantId" = $1) AS total,
              (SELECT count(*)::int FROM "SpaInscripciones" WHERE "TenantId" = $1) AS inscritos`,
      [t],
    )

    const bonos = await this.pool.query(
      `SELECT count(*)::int AS total,
              coalesce(sum("Precio"), 0)::float8 AS ingresos,
              coalesce(sum("SesionesRestantes"), 0)::int AS "sesionesRestantes"
         FROM "SpaBonos" WHERE "TenantId" = $1`,
      [t],
    )

    const topServicios = await this.pool.query(
      `SELECT "ServicioNombre" AS nombre, count(*)::int AS citas
         FROM "SpaCitas"
        WHERE "TenantId" = $1 AND "Estado" <> 'Cancelada'
        GROUP BY "ServicioNombre"
        ORDER BY citas DESC
        LIMIT 5`,
      [t],
    )

    const porTerapeuta = await this.pool.query(
      `SELECT coalesce(nullif("TrabajadorNombre", ''), '(sin asignar)') AS nombre,
              count(*)::int AS citas
         FROM "SpaCitas"
        WHERE "TenantId" = $1 AND "Estado" <> 'Cancelada'
        GROUP BY coalesce(nullif("TrabajadorNombre", ''), '(sin asignar)')
        ORDER BY citas DESC
        LIMIT 5`,
      [t],
    )

    return {
      citas: citas.rows[0],
      servicios: servicios.rows[0].n,
      trabajadores: trabajadores.rows[0].n,
      bebes: bebes.rows[0],
      eventos: eventos.rows[0],
      bonos: bonos.rows[0],
      topServicios: topServicios.rows,
      porTerapeuta: porTerapeuta.rows,
    }
  }
}
