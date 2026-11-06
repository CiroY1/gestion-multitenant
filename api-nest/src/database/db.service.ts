import { Inject, Injectable, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { Pool, QueryResult, QueryResultRow } from 'pg'
import { PG_POOL } from './pg.token'
import type { UsuarioJwt } from '../auth/jwt.strategy'

/**
 * Nombre del schema de una empresa. Validamos el tenant (viene del JWT, pero
 * se interpola en el SQL del search_path) para evitar inyección.
 */
export function schemaDeTenant(tenantId: string): string {
  if (!/^[a-z0-9_]+$/.test(tenantId)) {
    throw new Error(`Tenant inválido: ${tenantId}`)
  }
  return `t_${tenantId}`
}

/**
 * Acceso a datos con aislamiento por schema (multi-tenant). Por cada consulta
 * toma un cliente del pool, fija `search_path` al schema de la empresa (del
 * JWT) con `public` de respaldo (identidad e inventario viven en public) y
 * ejecuta la consulta. Es request-scoped para conocer el tenant de la petición.
 */
@Injectable({ scope: Scope.REQUEST })
export class Db {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REQUEST) private readonly req: { user?: UsuarioJwt },
  ) {}

  private get schema(): string {
    return schemaDeTenant(this.req.user?.tenantId ?? '')
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const schema = this.schema
    const client = await this.pool.connect()
    try {
      await client.query(`SET search_path TO "${schema}", public`)
      return await client.query<T>(text, params as never)
    } finally {
      client.release()
    }
  }
}
