import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { Db } from '../database/db.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ModSpaGuard } from './mod-spa.guard'

interface BebeDto {
  nombre?: string
  clienteId?: number
  fechaNacimiento?: string
  peso?: number
  alergias?: string
  notas?: string
}

/**
 * Ficha del bebé: datos del bebé que recibe los servicios. El responsable es
 * un cliente del maestro compartido (.NET). La edad y la elegibilidad se
 * calculan en el frontend a partir de FechaNacimiento. Multi-tenant.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard, RolesGuard)
@Controller('spa/bebes')
export class BebesController {
  constructor(private readonly pool: Db) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id,
              "Nombre" AS nombre,
              "ClienteId" AS "clienteId",
              "ClienteNombre" AS "clienteNombre",
              to_char("FechaNacimiento", 'YYYY-MM-DD') AS "fechaNacimiento",
              "Peso"::float8 AS peso,
              "Alergias" AS alergias,
              "Notas" AS notas
         FROM "SpaBebes"
        WHERE "TenantId" = $1
        ORDER BY "Nombre"`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: BebeDto) {
    const datos = await this.validar(u, dto)
    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaBebes"
         ("TenantId","Nombre","ClienteId","ClienteNombre",
          "FechaNacimiento","Peso","Alergias","Notas")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING "Id" AS id`,
      [
        u.tenantId,
        datos.nombre,
        datos.clienteId,
        datos.clienteNombre,
        datos.fechaNacimiento,
        datos.peso,
        datos.alergias,
        datos.notas,
      ],
    )
    return { id: rows[0].id, ok: true }
  }

  @Put(':id')
  async actualizar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BebeDto,
  ) {
    const datos = await this.validar(u, dto)
    const { rowCount } = await this.pool.query(
      `UPDATE "SpaBebes"
          SET "Nombre"=$1, "ClienteId"=$2, "ClienteNombre"=$3,
              "FechaNacimiento"=$4, "Peso"=$5, "Alergias"=$6, "Notas"=$7
        WHERE "Id"=$8 AND "TenantId"=$9`,
      [
        datos.nombre,
        datos.clienteId,
        datos.clienteNombre,
        datos.fechaNacimiento,
        datos.peso,
        datos.alergias,
        datos.notas,
        id,
        u.tenantId,
      ],
    )
    if (!rowCount) throw new BadRequestException('Bebé no encontrado.')
    return { ok: true }
  }

  @Roles('admin')
  @Delete(':id')
  async eliminar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaBebes" WHERE "Id"=$1 AND "TenantId"=$2`,
      [id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Bebé no encontrado.')
    return { ok: true }
  }

  /** Valida y normaliza los datos de entrada (comunes a crear/actualizar). */
  private async validar(u: UsuarioJwt, dto: BebeDto) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre del bebé es obligatorio.')

    const fecha = (dto.fechaNacimiento ?? '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(new Date(fecha).getTime())) {
      throw new BadRequestException('La fecha de nacimiento no es válida.')
    }
    if (new Date(fecha) > new Date()) {
      throw new BadRequestException('La fecha de nacimiento no puede ser futura.')
    }

    // Responsable (opcional): cliente del maestro compartido (.NET).
    let clienteId: number | null = null
    let clienteNombre = ''
    if (dto.clienteId != null && `${dto.clienteId}` !== '' && Number(dto.clienteId) > 0) {
      const cid = Number(dto.clienteId)
      if (!Number.isInteger(cid)) throw new BadRequestException('Cliente inválido.')
      const cli = await this.pool.query<{ Nombre: string }>(
        'SELECT "Nombre" FROM "Clientes" WHERE "Id"=$1 AND "TenantId"=$2',
        [cid, u.tenantId],
      )
      if (!cli.rowCount) throw new BadRequestException('El cliente no existe.')
      clienteId = cid
      clienteNombre = cli.rows[0].Nombre
    }

    const peso =
      dto.peso != null && Number.isFinite(Number(dto.peso)) && Number(dto.peso) > 0
        ? Number(dto.peso)
        : null

    return {
      nombre,
      clienteId,
      clienteNombre,
      fechaNacimiento: fecha,
      peso,
      alergias: (dto.alergias ?? '').trim(),
      notas: (dto.notas ?? '').trim(),
    }
  }
}
