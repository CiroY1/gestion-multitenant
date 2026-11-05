import {
  BadRequestException,
  Body,
  Controller,
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
import { ModSpaGuard } from './mod-spa.guard'

interface CitaDto {
  servicioId?: number
  clienteId?: number
  clienteNombre?: string
  trabajadorId?: number
  bebeNombre?: string
  fechaHora?: string
  notas?: string
}

/**
 * Agenda de citas del spa. Una cita une un servicio (tabla de Nest) con un
 * cliente del maestro compartido (tabla "Clientes", del backend .NET, en la
 * misma base Neon) y una fecha/hora.
 *
 * Se guardan "snapshots" del nombre del servicio y del cliente para que el
 * historial no cambie si luego se edita el catálogo o el cliente.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard)
@Controller('spa/citas')
export class CitasController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id,
              "ServicioId" AS "servicioId",
              "ServicioNombre" AS "servicioNombre",
              "ClienteId" AS "clienteId",
              "ClienteNombre" AS "clienteNombre",
              "TrabajadorId" AS "trabajadorId",
              "TrabajadorNombre" AS "trabajadorNombre",
              "DuracionMin" AS "duracionMin",
              "BebeNombre" AS "bebeNombre",
              "FechaHora" AS "fechaHora",
              "Estado" AS estado,
              "Notas" AS notas
         FROM "SpaCitas"
        WHERE "TenantId" = $1
        ORDER BY "FechaHora" DESC`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: CitaDto) {
    // Servicio: debe existir en el catálogo del tenant (tabla de Nest).
    const servicioId = Number(dto.servicioId)
    if (!Number.isInteger(servicioId)) {
      throw new BadRequestException('Selecciona un servicio.')
    }
    const serv = await this.pool.query<{ Nombre: string; DuracionMin: number }>(
      'SELECT "Nombre", "DuracionMin" FROM "SpaServicios" WHERE "Id" = $1 AND "TenantId" = $2',
      [servicioId, u.tenantId],
    )
    if (!serv.rowCount) {
      throw new BadRequestException('El servicio no existe.')
    }

    // Terapeuta (opcional): si viene, debe existir; guardamos su nombre como snapshot.
    let trabajadorId: number | null = null
    let trabajadorNombre = ''
    if (dto.trabajadorId != null && `${dto.trabajadorId}` !== '') {
      const tid = Number(dto.trabajadorId)
      if (!Number.isInteger(tid)) throw new BadRequestException('Terapeuta inválido.')
      const trab = await this.pool.query<{ Nombre: string }>(
        'SELECT "Nombre" FROM "SpaTrabajadores" WHERE "Id" = $1 AND "TenantId" = $2',
        [tid, u.tenantId],
      )
      if (!trab.rowCount) throw new BadRequestException('El terapeuta no existe.')
      trabajadorId = tid
      trabajadorNombre = trab.rows[0].Nombre
    }

    // Cliente: si viene un id, lo validamos contra el maestro compartido
    // ("Clientes", del backend .NET) y usamos su nombre como snapshot.
    let clienteId: number | null = null
    let clienteNombre = (dto.clienteNombre ?? '').trim()
    if (dto.clienteId != null && `${dto.clienteId}` !== '') {
      const id = Number(dto.clienteId)
      if (!Number.isInteger(id)) throw new BadRequestException('Cliente inválido.')
      const cli = await this.pool.query<{ Nombre: string }>(
        'SELECT "Nombre" FROM "Clientes" WHERE "Id" = $1 AND "TenantId" = $2',
        [id, u.tenantId],
      )
      if (!cli.rowCount) throw new BadRequestException('El cliente no existe.')
      clienteId = id
      clienteNombre = cli.rows[0].Nombre
    }
    if (!clienteNombre) {
      throw new BadRequestException('Indica un cliente.')
    }

    // Fecha/hora obligatoria y válida.
    const fecha = new Date(dto.fechaHora ?? '')
    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('La fecha y hora no son válidas.')
    }

    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaCitas"
         ("TenantId","ServicioId","ServicioNombre","ClienteId","ClienteNombre",
          "TrabajadorId","TrabajadorNombre","DuracionMin",
          "BebeNombre","FechaHora","Estado","Notas")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Programada',$11)
       RETURNING "Id" AS id`,
      [
        u.tenantId,
        servicioId,
        serv.rows[0].Nombre,
        clienteId,
        clienteNombre,
        trabajadorId,
        trabajadorNombre,
        serv.rows[0].DuracionMin ?? 30,
        (dto.bebeNombre ?? '').trim(),
        fecha,
        (dto.notas ?? '').trim(),
      ],
    )
    return { id: rows[0].id, ok: true }
  }

  @Post(':id/atender')
  atender(@CurrentUser() u: UsuarioJwt, @Param('id', ParseIntPipe) id: number) {
    return this.cambiarEstado(u, id, 'Atendida')
  }

  @Post(':id/cancelar')
  cancelar(@CurrentUser() u: UsuarioJwt, @Param('id', ParseIntPipe) id: number) {
    return this.cambiarEstado(u, id, 'Cancelada')
  }

  /** Solo se puede atender/cancelar una cita que siga 'Programada'. */
  private async cambiarEstado(
    u: UsuarioJwt,
    id: number,
    estado: 'Atendida' | 'Cancelada',
  ) {
    const { rowCount } = await this.pool.query(
      `UPDATE "SpaCitas"
          SET "Estado" = $1
        WHERE "Id" = $2 AND "TenantId" = $3 AND "Estado" = 'Programada'`,
      [estado, id, u.tenantId],
    )
    if (!rowCount) {
      throw new BadRequestException(
        'La cita no existe o ya no está programada.',
      )
    }
    return { ok: true }
  }
}
