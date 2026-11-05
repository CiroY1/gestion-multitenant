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
import { Pool } from 'pg'
import { PG_POOL } from '../database/pg.token'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ModSpaGuard } from './mod-spa.guard'

interface PaqueteDto {
  nombre?: string
  sesiones?: number
  precio?: number
  activo?: boolean
}

/** Catálogo de paquetes (bonos) de sesiones que se venden. Multi-tenant. */
@UseGuards(JwtAuthGuard, ModSpaGuard, RolesGuard)
@Controller('spa/paquetes')
export class PaquetesController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id, "Nombre" AS nombre, "Sesiones" AS sesiones,
              "Precio"::float8 AS precio, "Activo" AS activo
         FROM "SpaPaquetes"
        WHERE "TenantId" = $1
        ORDER BY "Nombre"`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: PaqueteDto) {
    const { nombre, sesiones, precio, activo } = this.validar(dto)
    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaPaquetes" ("TenantId","Nombre","Sesiones","Precio","Activo")
       VALUES ($1,$2,$3,$4,$5) RETURNING "Id" AS id`,
      [u.tenantId, nombre, sesiones, precio, activo],
    )
    return { id: rows[0].id, ok: true }
  }

  @Put(':id')
  async actualizar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PaqueteDto,
  ) {
    const { nombre, sesiones, precio, activo } = this.validar(dto)
    const { rowCount } = await this.pool.query(
      `UPDATE "SpaPaquetes"
          SET "Nombre"=$1, "Sesiones"=$2, "Precio"=$3, "Activo"=$4
        WHERE "Id"=$5 AND "TenantId"=$6`,
      [nombre, sesiones, precio, activo, id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Paquete no encontrado.')
    return { ok: true }
  }

  @Roles('admin')
  @Delete(':id')
  async eliminar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaPaquetes" WHERE "Id"=$1 AND "TenantId"=$2`,
      [id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Paquete no encontrado.')
    return { ok: true }
  }

  private validar(dto: PaqueteDto) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre es obligatorio.')
    const sesiones = Number(dto.sesiones)
    if (!Number.isInteger(sesiones) || sesiones < 1) {
      throw new BadRequestException('Las sesiones deben ser un número mayor a 0.')
    }
    const precio =
      Number.isFinite(Number(dto.precio)) && Number(dto.precio) >= 0 ? Number(dto.precio) : 0
    return { nombre, sesiones, precio, activo: dto.activo ?? true }
  }
}
