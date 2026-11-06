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

interface SalaDto {
  nombre?: string
  activa?: boolean
}

/** Salas / recursos del spa (p. ej. tinas de hidroterapia). Multi-tenant. */
@UseGuards(JwtAuthGuard, ModSpaGuard, RolesGuard)
@Controller('spa/salas')
export class SalasController {
  constructor(private readonly pool: Db) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id, "Nombre" AS nombre, "Activa" AS activa
         FROM "SpaSalas"
        WHERE "TenantId" = $1
        ORDER BY "Nombre"`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: SalaDto) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre de la sala es obligatorio.')
    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaSalas" ("TenantId","Nombre","Activa")
       VALUES ($1,$2,$3) RETURNING "Id" AS id`,
      [u.tenantId, nombre, dto.activa ?? true],
    )
    return { id: rows[0].id, ok: true }
  }

  @Put(':id')
  async actualizar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SalaDto,
  ) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre de la sala es obligatorio.')
    const { rowCount } = await this.pool.query(
      `UPDATE "SpaSalas" SET "Nombre"=$1, "Activa"=$2 WHERE "Id"=$3 AND "TenantId"=$4`,
      [nombre, dto.activa ?? true, id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Sala no encontrada.')
    return { ok: true }
  }

  @Roles('admin')
  @Delete(':id')
  async eliminar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaSalas" WHERE "Id"=$1 AND "TenantId"=$2`,
      [id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Sala no encontrada.')
    return { ok: true }
  }
}
