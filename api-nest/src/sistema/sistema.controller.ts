import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from '../database/database.module'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { UsuarioJwt } from '../auth/jwt.strategy'

/**
 * Módulo de diagnóstico del segundo backend. Sirve para comprobar, de punta a
 * punta, que NestJS:
 *  - levanta y responde (health),
 *  - valida el MISMO JWT que emite .NET (me),
 *  - comparte la MISMA base Neon y respeta el multi-tenant (db-check).
 */
@Controller('sistema')
export class SistemaController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Salud del backend (público). */
  @Get('health')
  health() {
    return { ok: true, backend: 'nestjs', hora: new Date().toISOString() }
  }

  /** Identidad del token: demuestra que el JWT de .NET vale aquí. */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() usuario: UsuarioJwt) {
    return { backend: 'nestjs', usuario }
  }

  /** Cuenta productos del tenant: demuestra base Neon compartida + multi-tenant. */
  @UseGuards(JwtAuthGuard)
  @Get('db-check')
  async dbCheck(@CurrentUser() usuario: UsuarioJwt) {
    const { rows } = await this.pool.query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM "Productos" WHERE "TenantId" = $1',
      [usuario.tenantId],
    )
    return {
      backend: 'nestjs',
      tenant: usuario.tenantId,
      productos: rows[0]?.total ?? 0,
      ok: true,
    }
  }
}
