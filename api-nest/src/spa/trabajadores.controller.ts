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

interface TrabajadorDto {
  nombre?: string
  rol?: string
  email?: string
  activo?: boolean
}

/**
 * Trabajadores del spa (terapeutas, recepción, etc.). Multi-tenant.
 * El Email vincula al trabajador con su usuario de login: sirve para que solo
 * el trabajador asignado (o un admin) pueda cambiar el estado de sus tareas.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard, RolesGuard)
@Controller('spa/trabajadores')
export class TrabajadoresController {
  constructor(private readonly pool: Db) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id, "Nombre" AS nombre, "Rol" AS rol,
              "Email" AS email, "Activo" AS activo
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
      `INSERT INTO "SpaTrabajadores" ("TenantId","Nombre","Rol","Email","Activo")
       VALUES ($1,$2,$3,$4,$5) RETURNING "Id" AS id`,
      [
        u.tenantId,
        nombre,
        (dto.rol ?? '').trim(),
        (dto.email ?? '').trim().toLowerCase(),
        dto.activo ?? true,
      ],
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
          SET "Nombre"=$1, "Rol"=$2, "Email"=$3, "Activo"=$4
        WHERE "Id"=$5 AND "TenantId"=$6`,
      [
        nombre,
        (dto.rol ?? '').trim(),
        (dto.email ?? '').trim().toLowerCase(),
        dto.activo ?? true,
        id,
        u.tenantId,
      ],
    )
    if (!rowCount) throw new BadRequestException('Trabajador no encontrado.')
    return { ok: true }
  }

  @Roles('admin')
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
