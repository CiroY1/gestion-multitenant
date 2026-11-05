import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/pg.token'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { ModSpaGuard } from './mod-spa.guard'

interface TareaDto {
  titulo?: string
  trabajadorId?: number
  fechaHora?: string
  notas?: string
}

/**
 * Agenda de tareas: lo que debe hacer cada trabajador. Cada tarea tiene un
 * responsable (trabajador del spa), fecha/hora y un ciclo de estado
 * Pendiente -> En progreso -> Hecha. Multi-tenant.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard)
@Controller('spa/tareas')
export class TareasController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async listar(
    @CurrentUser() u: UsuarioJwt,
    @Query('trabajadorId') trabajadorId?: string,
  ) {
    const params: (string | number)[] = [u.tenantId]
    let filtro = ''
    const idNum = Number(trabajadorId)
    if (trabajadorId != null && trabajadorId !== '' && Number.isInteger(idNum)) {
      params.push(idNum)
      filtro = ` AND "TrabajadorId" = $2`
    }
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id,
              "Titulo" AS titulo,
              "TrabajadorId" AS "trabajadorId",
              "TrabajadorNombre" AS "trabajadorNombre",
              "FechaHora" AS "fechaHora",
              "Estado" AS estado,
              "Notas" AS notas
         FROM "SpaTareas"
        WHERE "TenantId" = $1${filtro}
        ORDER BY "FechaHora"`,
      params,
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: TareaDto) {
    const titulo = (dto.titulo ?? '').trim()
    if (!titulo) throw new BadRequestException('El título es obligatorio.')

    const trabajadorId = Number(dto.trabajadorId)
    if (!Number.isInteger(trabajadorId)) {
      throw new BadRequestException('Selecciona un trabajador.')
    }
    const trab = await this.pool.query<{ Nombre: string }>(
      'SELECT "Nombre" FROM "SpaTrabajadores" WHERE "Id"=$1 AND "TenantId"=$2',
      [trabajadorId, u.tenantId],
    )
    if (!trab.rowCount) throw new BadRequestException('El trabajador no existe.')

    const fecha = new Date(dto.fechaHora ?? '')
    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('La fecha y hora no son válidas.')
    }

    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaTareas"
         ("TenantId","Titulo","TrabajadorId","TrabajadorNombre","FechaHora","Estado","Notas")
       VALUES ($1,$2,$3,$4,$5,'Pendiente',$6)
       RETURNING "Id" AS id`,
      [u.tenantId, titulo, trabajadorId, trab.rows[0].Nombre, fecha, (dto.notas ?? '').trim()],
    )
    return { id: rows[0].id, ok: true }
  }

  @Post(':id/iniciar')
  iniciar(@CurrentUser() u: UsuarioJwt, @Param('id', ParseIntPipe) id: number) {
    // Solo una tarea Pendiente puede pasar a En progreso.
    return this.cambiarEstado(u, id, 'EnProgreso', ['Pendiente'])
  }

  @Post(':id/completar')
  completar(@CurrentUser() u: UsuarioJwt, @Param('id', ParseIntPipe) id: number) {
    // Se puede completar desde Pendiente o En progreso.
    return this.cambiarEstado(u, id, 'Hecha', ['Pendiente', 'EnProgreso'])
  }

  private async cambiarEstado(
    u: UsuarioJwt,
    id: number,
    estado: 'EnProgreso' | 'Hecha',
    desde: string[],
  ) {
    // Traemos la tarea y el email del trabajador asignado (vínculo con el login).
    const { rows } = await this.pool.query<{
      estado: string
      trabajadorEmail: string | null
    }>(
      `SELECT t."Estado" AS estado, w."Email" AS "trabajadorEmail"
         FROM "SpaTareas" t
         LEFT JOIN "SpaTrabajadores" w ON w."Id" = t."TrabajadorId"
        WHERE t."Id" = $1 AND t."TenantId" = $2`,
      [id, u.tenantId],
    )
    if (!rows.length) throw new BadRequestException('La tarea no existe.')
    const tarea = rows[0]

    // Solo el admin o el trabajador asignado (vinculado por email) puede cambiarla.
    const esAdmin = u.rol === 'admin'
    const email = (u.email ?? '').toLowerCase()
    const esAsignado =
      !!tarea.trabajadorEmail && tarea.trabajadorEmail.toLowerCase() === email
    if (!esAdmin && !esAsignado) {
      throw new ForbiddenException(
        'Solo el trabajador asignado o un administrador puede cambiar esta tarea.',
      )
    }

    if (!desde.includes(tarea.estado)) {
      throw new BadRequestException('La tarea no permite ese cambio.')
    }

    await this.pool.query(
      `UPDATE "SpaTareas" SET "Estado" = $1 WHERE "Id" = $2 AND "TenantId" = $3`,
      [estado, id, u.tenantId],
    )
    return { ok: true }
  }
}
