import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from './pg.token'
import { MIGRACIONES } from './migrations'

/**
 * Aplica las migraciones pendientes al arrancar. Cada una corre en su propia
 * transacción y se registra en "NestMigrations"; si ya está registrada, se omite.
 */
@Injectable()
export class MigrationsService implements OnModuleInit {
  private readonly logger = new Logger('Migrations')

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS "NestMigrations" (
        "Id"        text PRIMARY KEY,
        "AplicadaEn" timestamptz NOT NULL DEFAULT now()
      );
    `)

    const { rows } = await this.pool.query<{ Id: string }>(
      'SELECT "Id" FROM "NestMigrations"',
    )
    const aplicadas = new Set(rows.map((r) => r.Id))

    for (const m of MIGRACIONES) {
      if (aplicadas.has(m.id)) continue
      const client = await this.pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(m.sql)
        await client.query('INSERT INTO "NestMigrations" ("Id") VALUES ($1)', [m.id])
        await client.query('COMMIT')
        this.logger.log(`Migración aplicada: ${m.id}`)
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    }
  }
}
