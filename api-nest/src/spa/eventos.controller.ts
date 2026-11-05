import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/pg.token'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ModSpaGuard } from './mod-spa.guard'

interface EventoDto {
  titulo?: string
  fechaHora?: string
  duracionMin?: number
  cupo?: number
  trabajadorId?: number
  salaId?: number
  notas?: string
}

interface InscripcionDto {
  bebeId?: number
}

/**
 * Eventos / clases grupales del spa (p. ej. estimulación temprana). Cada evento
 * tiene un cupo y acepta inscripciones de bebés hasta llenarlo. Multi-tenant.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard, RolesGuard)
@Controller('spa/eventos')
export class EventosController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT e."Id" AS id,
              e."Titulo" AS titulo,
              e."FechaHora" AS "fechaHora",
              e."DuracionMin" AS "duracionMin",
              e."Cupo" AS cupo,
              e."TrabajadorId" AS "trabajadorId",
              e."TrabajadorNombre" AS "trabajadorNombre",
              e."SalaId" AS "salaId",
              e."SalaNombre" AS "salaNombre",
              e."Notas" AS notas,
              (SELECT count(*)::int FROM "SpaInscripciones" i
                 WHERE i."EventoId" = e."Id") AS inscritos
         FROM "SpaEventos" e
        WHERE e."TenantId" = $1
        ORDER BY e."FechaHora" DESC`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: EventoDto) {
    const titulo = (dto.titulo ?? '').trim()
    if (!titulo) throw new BadRequestException('El título es obligatorio.')

    const fecha = new Date(dto.fechaHora ?? '')
    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('La fecha y hora no son válidas.')
    }
    const cupo = Number(dto.cupo)
    if (!Number.isInteger(cupo) || cupo < 1) {
      throw new BadRequestException('El cupo debe ser un número mayor a 0.')
    }
    const duracion =
      Number.isFinite(Number(dto.duracionMin)) && Number(dto.duracionMin) > 0
        ? Math.trunc(Number(dto.duracionMin))
        : 60

    const trab = await this.snapshot(u, 'SpaTrabajadores', dto.trabajadorId)
    const sala = await this.snapshot(u, 'SpaSalas', dto.salaId)

    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaEventos"
         ("TenantId","Titulo","FechaHora","DuracionMin","Cupo",
          "TrabajadorId","TrabajadorNombre","SalaId","SalaNombre","Notas")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING "Id" AS id`,
      [
        u.tenantId,
        titulo,
        fecha,
        duracion,
        cupo,
        trab.id,
        trab.nombre,
        sala.id,
        sala.nombre,
        (dto.notas ?? '').trim(),
      ],
    )
    return { id: rows[0].id, ok: true }
  }

  @Roles('admin')
  @Delete(':id')
  async eliminar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.pool.query(
      `DELETE FROM "SpaInscripciones" WHERE "EventoId"=$1 AND "TenantId"=$2`,
      [id, u.tenantId],
    )
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaEventos" WHERE "Id"=$1 AND "TenantId"=$2`,
      [id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Evento no encontrado.')
    return { ok: true }
  }

  @Get(':id/inscripciones')
  async inscripciones(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id, "BebeId" AS "bebeId", "BebeNombre" AS "bebeNombre"
         FROM "SpaInscripciones"
        WHERE "EventoId" = $1 AND "TenantId" = $2
        ORDER BY "BebeNombre"`,
      [id, u.tenantId],
    )
    return rows
  }

  @Post(':id/inscribir')
  async inscribir(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InscripcionDto,
  ) {
    const evento = await this.pool.query<{ Cupo: number }>(
      'SELECT "Cupo" FROM "SpaEventos" WHERE "Id"=$1 AND "TenantId"=$2',
      [id, u.tenantId],
    )
    if (!evento.rowCount) throw new BadRequestException('El evento no existe.')

    const bebeId = Number(dto.bebeId)
    if (!Number.isInteger(bebeId)) throw new BadRequestException('Selecciona un bebé.')
    const bebe = await this.pool.query<{ Nombre: string }>(
      'SELECT "Nombre" FROM "SpaBebes" WHERE "Id"=$1 AND "TenantId"=$2',
      [bebeId, u.tenantId],
    )
    if (!bebe.rowCount) throw new BadRequestException('El bebé no existe.')

    const yaInscrito = await this.pool.query(
      'SELECT 1 FROM "SpaInscripciones" WHERE "EventoId"=$1 AND "TenantId"=$2 AND "BebeId"=$3 LIMIT 1',
      [id, u.tenantId, bebeId],
    )
    if (yaInscrito.rowCount) {
      throw new BadRequestException('Ese bebé ya está inscrito en el evento.')
    }

    const cuenta = await this.pool.query<{ total: number }>(
      'SELECT count(*)::int AS total FROM "SpaInscripciones" WHERE "EventoId"=$1 AND "TenantId"=$2',
      [id, u.tenantId],
    )
    if ((cuenta.rows[0]?.total ?? 0) >= evento.rows[0].Cupo) {
      throw new ConflictException('El evento ya alcanzó su cupo.')
    }

    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaInscripciones" ("TenantId","EventoId","BebeId","BebeNombre")
       VALUES ($1,$2,$3,$4) RETURNING "Id" AS id`,
      [u.tenantId, id, bebeId, bebe.rows[0].Nombre],
    )
    return { id: rows[0].id, ok: true }
  }

  @Delete(':id/inscripciones/:insId')
  async desinscribir(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
    @Param('insId', ParseIntPipe) insId: number,
  ) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaInscripciones"
        WHERE "Id"=$1 AND "EventoId"=$2 AND "TenantId"=$3`,
      [insId, id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Inscripción no encontrada.')
    return { ok: true }
  }

  /** Valida y devuelve {id, nombre} de un trabajador o sala opcional. */
  private async snapshot(
    u: UsuarioJwt,
    tabla: 'SpaTrabajadores' | 'SpaSalas',
    valor: number | undefined,
  ): Promise<{ id: number | null; nombre: string }> {
    if (valor == null || `${valor}` === '' || Number(valor) <= 0) {
      return { id: null, nombre: '' }
    }
    const idNum = Number(valor)
    if (!Number.isInteger(idNum)) throw new BadRequestException('Referencia inválida.')
    const r = await this.pool.query<{ Nombre: string }>(
      `SELECT "Nombre" FROM "${tabla}" WHERE "Id"=$1 AND "TenantId"=$2`,
      [idNum, u.tenantId],
    )
    if (!r.rowCount) throw new BadRequestException('Referencia no encontrada.')
    return { id: idNum, nombre: r.rows[0].Nombre }
  }
}
