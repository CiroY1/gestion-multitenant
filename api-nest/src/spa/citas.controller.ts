import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Db } from '../database/db.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { ModSpaGuard } from './mod-spa.guard'

interface CitaDto {
  servicioId?: number
  clienteId?: number
  clienteNombre?: string
  trabajadorId?: number
  salaId?: number
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
  constructor(private readonly pool: Db) {}

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
              "SalaId" AS "salaId",
              "SalaNombre" AS "salaNombre",
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

    // Sala (opcional): si viene, debe existir; guardamos su nombre como snapshot.
    let salaId: number | null = null
    let salaNombre = ''
    if (dto.salaId != null && `${dto.salaId}` !== '' && Number(dto.salaId) > 0) {
      const sid = Number(dto.salaId)
      if (!Number.isInteger(sid)) throw new BadRequestException('Sala inválida.')
      const sala = await this.pool.query<{ Nombre: string }>(
        'SELECT "Nombre" FROM "SpaSalas" WHERE "Id" = $1 AND "TenantId" = $2',
        [sid, u.tenantId],
      )
      if (!sala.rowCount) throw new BadRequestException('La sala no existe.')
      salaId = sid
      salaNombre = sala.rows[0].Nombre
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

    // Bloque de tiempo de la cita: [fecha, fecha + duración).
    const dur = serv.rows[0].DuracionMin ?? 30
    const fin = new Date(fecha.getTime() + dur * 60_000)

    // Evitar doble reserva: el terapeuta y la sala no pueden tener otra cita
    // (no cancelada) que se solape en ese horario.
    if (trabajadorId) {
      await this.verificarSolape('TrabajadorId', trabajadorId, u.tenantId, fecha, fin,
        'El terapeuta ya tiene una cita en ese horario.')
    }
    if (salaId) {
      await this.verificarSolape('SalaId', salaId, u.tenantId, fecha, fin,
        'La sala ya está ocupada en ese horario.')
    }

    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaCitas"
         ("TenantId","ServicioId","ServicioNombre","ClienteId","ClienteNombre",
          "TrabajadorId","TrabajadorNombre","SalaId","SalaNombre","DuracionMin",
          "BebeNombre","FechaHora","Estado","Notas")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Programada',$13)
       RETURNING "Id" AS id`,
      [
        u.tenantId,
        servicioId,
        serv.rows[0].Nombre,
        clienteId,
        clienteNombre,
        trabajadorId,
        trabajadorNombre,
        salaId,
        salaNombre,
        dur,
        (dto.bebeNombre ?? '').trim(),
        fecha,
        (dto.notas ?? '').trim(),
      ],
    )
    return { id: rows[0].id, ok: true }
  }

  /** Lanza 409 si ya hay otra cita (no cancelada) que se solapa por esa columna. */
  private async verificarSolape(
    columna: 'TrabajadorId' | 'SalaId',
    valor: number,
    tenantId: string,
    inicio: Date,
    fin: Date,
    mensaje: string,
  ): Promise<void> {
    const { rowCount } = await this.pool.query(
      `SELECT 1 FROM "SpaCitas"
        WHERE "TenantId" = $1 AND "Estado" <> 'Cancelada' AND "${columna}" = $2
          AND "FechaHora" < $3
          AND ("FechaHora" + ("DuracionMin" || ' minutes')::interval) > $4
        LIMIT 1`,
      [tenantId, valor, fin, inicio],
    )
    if (rowCount) throw new ConflictException(mensaje)
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
