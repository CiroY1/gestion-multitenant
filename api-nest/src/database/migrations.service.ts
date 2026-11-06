import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Pool } from 'pg'
import { PG_POOL } from './pg.token'
import { MIGRACIONES } from './migrations'
import { schemaDeTenant } from './db.service'

/** Tablas del dominio spa (viven en el schema de cada empresa). */
const SPA_TABLES = [
  'SpaServicios',
  'SpaTrabajadores',
  'SpaTareas',
  'SpaCitas',
  'SpaBebes',
  'SpaSalas',
  'SpaEventos',
  'SpaInscripciones',
  'SpaPaquetes',
  'SpaBonos',
]

/**
 * Multi-tenant por schema: cada empresa tiene su propio schema (t_<id>) con las
 * tablas del dominio spa. La identidad (Empresas, Usuarios) y el inventario
 * siguen en public.
 *
 * Al arrancar: (1) si el spa aún vive en public (layout viejo), mueve esas
 * tablas a t_demo; (2) por cada empresa, crea su schema y aplica el DDL spa
 * (idempotente) dentro de él.
 */
@Injectable()
export class MigrationsService implements OnModuleInit {
  private readonly logger = new Logger('Migrations')

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.moverDemoSiHaceFalta()

    const { rows } = await this.pool.query<{ Id: string }>(
      'SELECT "Id" FROM public."Empresas"',
    )
    for (const e of rows) {
      await this.provisionar(e.Id)
    }
    this.logger.log(
      `Schemas spa aprovisionados para ${rows.length} empresa(s).`,
    )
  }

  /** Crea el schema de una empresa y aplica el DDL spa (idempotente) dentro. */
  async provisionar(tenantId: string): Promise<void> {
    const schema = schemaDeTenant(tenantId)
    const client = await this.pool.connect()
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
      await client.query(`SET search_path TO "${schema}", public`)
      for (const m of MIGRACIONES) {
        await client.query(m.sql)
      }
    } finally {
      client.release()
    }
  }

  /**
   * Migración de datos: si las tablas spa todavía están en public (como antes
   * del multi-tenant por schema), las mueve a t_demo (todos sus datos son de la
   * empresa demo). Se ejecuta una sola vez.
   */
  private async moverDemoSiHaceFalta(): Promise<void> {
    const existe = await this.pool.query(
      `SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'SpaServicios' LIMIT 1`,
    )
    if (!existe.rowCount) return

    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('CREATE SCHEMA IF NOT EXISTS "t_demo"')
      for (const t of SPA_TABLES) {
        await client.query(`ALTER TABLE IF EXISTS public."${t}" SET SCHEMA "t_demo"`)
      }
      await client.query('COMMIT')
      this.logger.log('Datos spa de demo movidos de public a t_demo.')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}
