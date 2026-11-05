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
import { PG_POOL } from '../database/database.module'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { ModSpaGuard } from './mod-spa.guard'

interface ServicioDto {
  nombre?: string
  descripcion?: string
  duracionMin?: number
  precio?: number
  activo?: boolean
}

/**
 * Catálogo de servicios del spa de bebés (p. ej. hidroterapia, masaje).
 * Primer módulo de negocio que vive en el segundo backend (NestJS).
 *
 * Doble guard: JWT válido (JwtAuthGuard) + empresa con módulo spa (ModSpaGuard).
 * Todas las consultas filtran por TenantId: aislamiento multi-tenant.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard)
@Controller('spa/servicios')
export class ServiciosController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id,
              "Nombre" AS nombre,
              "Descripcion" AS descripcion,
              "DuracionMin" AS "duracionMin",
              "Precio"::float8 AS precio,
              "Activo" AS activo,
              "CreadoEn" AS "creadoEn"
         FROM "SpaServicios"
        WHERE "TenantId" = $1
        ORDER BY "Nombre"`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async crear(@CurrentUser() u: UsuarioJwt, @Body() dto: ServicioDto) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre es obligatorio.')

    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaServicios"
         ("TenantId", "Nombre", "Descripcion", "DuracionMin", "Precio", "Activo")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING "Id" AS id`,
      [
        u.tenantId,
        nombre,
        (dto.descripcion ?? '').trim(),
        this.entero(dto.duracionMin, 30),
        this.numero(dto.precio, 0),
        dto.activo ?? true,
      ],
    )
    return { id: rows[0].id, ok: true }
  }

  @Put(':id')
  async actualizar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ServicioDto,
  ) {
    const nombre = (dto.nombre ?? '').trim()
    if (!nombre) throw new BadRequestException('El nombre es obligatorio.')

    const { rowCount } = await this.pool.query(
      `UPDATE "SpaServicios"
          SET "Nombre" = $1,
              "Descripcion" = $2,
              "DuracionMin" = $3,
              "Precio" = $4,
              "Activo" = $5
        WHERE "Id" = $6 AND "TenantId" = $7`,
      [
        nombre,
        (dto.descripcion ?? '').trim(),
        this.entero(dto.duracionMin, 30),
        this.numero(dto.precio, 0),
        dto.activo ?? true,
        id,
        u.tenantId,
      ],
    )
    if (!rowCount) throw new BadRequestException('Servicio no encontrado.')
    return { ok: true }
  }

  @Delete(':id')
  async eliminar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaServicios" WHERE "Id" = $1 AND "TenantId" = $2`,
      [id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Servicio no encontrado.')
    return { ok: true }
  }

  private entero(v: unknown, def: number): number {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : def
  }

  private numero(v: unknown, def: number): number {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : def
  }
}
