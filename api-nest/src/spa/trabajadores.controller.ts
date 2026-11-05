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
import { ModSpaGuard } from './mod-spa.guard'

interface TrabajadorDto {
  nombre?: string
  rol?: string
  activo?: boolean
}

/** Trabajadores del spa (terapeutas, recepción, etc.). Multi-tenant. */
@UseGuards(JwtAuthGuard, ModSpaGuard)
@Controller('spa/trabajadores')
export class TrabajadoresController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id, "Nombre" AS nombre, "Rol" AS rol, "Activo" AS activo
         FROM "SpaTrabajadores"
        WHERE "TenantId" = $1
        ORDER BY "Nombre"`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: TrabajadorDto) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre es obligatorio.')
    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaTrabajadores" ("TenantId","Nombre","Rol","Activo")
       VALUES ($1,$2,$3,$4) RETURNING "Id" AS id`,
      [u.tenantId, nombre, (dto.rol ?? '').trim(), dto.activo ?? true],
    )
    return { id: rows[0].id, ok: true }
  }

  @Put(':id')
  async actualizar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TrabajadorDto,
  ) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre es obligatorio.')
    const { rowCount } = await this.pool.query(
      `UPDATE "SpaTrabajadores"
          SET "Nombre"=$1, "Rol"=$2, "Activo"=$3
        WHERE "Id"=$4 AND "TenantId"=$5`,
      [nombre, (dto.rol ?? '').trim(), dto.activo ?? true, id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Trabajador no encontrado.')
    return { ok: true }
  }

  @Delete(':id')
  async eliminar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaTrabajadores" WHERE "Id"=$1 AND "TenantId"=$2`,
      [id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Trabajador no encontrado.')
    return { ok: true }
  }
}
