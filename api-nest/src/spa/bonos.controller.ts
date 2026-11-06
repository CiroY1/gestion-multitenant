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
import { Db } from '../database/db.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ModSpaGuard } from './mod-spa.guard'

interface VentaDto {
  clienteId?: number
  paqueteId?: number
}

/**
 * Bonos vendidos: un cliente compra un paquete y recibe un saldo de sesiones
 * que se va consumiendo. Multi-tenant.
 */
@UseGuards(JwtAuthGuard, ModSpaGuard, RolesGuard)
@Controller('spa/bonos')
export class BonosController {
  constructor(private readonly pool: Db) {}

  @Get()
  async listar(@CurrentUser() u: UsuarioJwt) {
    const { rows } = await this.pool.query(
      `SELECT "Id" AS id,
              "ClienteId" AS "clienteId",
              "ClienteNombre" AS "clienteNombre",
              "PaqueteNombre" AS "paqueteNombre",
              "SesionesTotal" AS "sesionesTotal",
              "SesionesRestantes" AS "sesionesRestantes",
              "Precio"::float8 AS precio,
              "CreadoEn" AS "creadoEn"
         FROM "SpaBonos"
        WHERE "TenantId" = $1
        ORDER BY "CreadoEn" DESC`,
      [u.tenantId],
    )
    return rows
  }

  @Post()
  async vender(@CurrentUser() u: UsuarioJwt, @Body() dto: VentaDto) {
    // Cliente del maestro compartido (.NET).
    const clienteId = Number(dto.clienteId)
    if (!Number.isInteger(clienteId)) throw new BadRequestException('Selecciona un cliente.')
    const cli = await this.pool.query<{ Nombre: string }>(
      'SELECT "Nombre" FROM "Clientes" WHERE "Id"=$1 AND "TenantId"=$2',
      [clienteId, u.tenantId],
    )
    if (!cli.rowCount) throw new BadRequestException('El cliente no existe.')

    // Paquete del catálogo.
    const paqueteId = Number(dto.paqueteId)
    if (!Number.isInteger(paqueteId)) throw new BadRequestException('Selecciona un paquete.')
    const paq = await this.pool.query<{
      Nombre: string
      Sesiones: number
      Precio: string
    }>(
      'SELECT "Nombre", "Sesiones", "Precio" FROM "SpaPaquetes" WHERE "Id"=$1 AND "TenantId"=$2',
      [paqueteId, u.tenantId],
    )
    if (!paq.rowCount) throw new BadRequestException('El paquete no existe.')
    const p = paq.rows[0]

    const { rows } = await this.pool.query<{ id: number }>(
      `INSERT INTO "SpaBonos"
         ("TenantId","ClienteId","ClienteNombre","PaqueteNombre",
          "SesionesTotal","SesionesRestantes","Precio")
       VALUES ($1,$2,$3,$4,$5,$5,$6)
       RETURNING "Id" AS id`,
      [u.tenantId, clienteId, cli.rows[0].Nombre, p.Nombre, p.Sesiones, p.Precio],
    )
    return { id: rows[0].id, ok: true }
  }

  @Post(':id/consumir')
  async consumir(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Resta una sesión de forma atómica solo si queda saldo.
    const { rows } = await this.pool.query<{ restantes: number }>(
      `UPDATE "SpaBonos"
          SET "SesionesRestantes" = "SesionesRestantes" - 1
        WHERE "Id"=$1 AND "TenantId"=$2 AND "SesionesRestantes" > 0
       RETURNING "SesionesRestantes" AS restantes`,
      [id, u.tenantId],
    )
    if (!rows.length) {
      // No existe o ya no tiene saldo.
      const existe = await this.pool.query(
        'SELECT 1 FROM "SpaBonos" WHERE "Id"=$1 AND "TenantId"=$2 LIMIT 1',
        [id, u.tenantId],
      )
      if (!existe.rowCount) throw new BadRequestException('Bono no encontrado.')
      throw new ConflictException('El bono ya no tiene sesiones disponibles.')
    }
    return { ok: true, restantes: rows[0].restantes }
  }

  @Roles('admin')
  @Delete(':id')
  async eliminar(
    @CurrentUser() u: UsuarioJwt,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM "SpaBonos" WHERE "Id"=$1 AND "TenantId"=$2`,
      [id, u.tenantId],
    )
    if (!rowCount) throw new BadRequestException('Bono no encontrado.')
    return { ok: true }
  }
}
