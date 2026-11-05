import { Global, Module } from '@nestjs/common'
import { Pool } from 'pg'

/** Token de inyección del pool de conexiones a Postgres (Neon). */
export const PG_POOL = 'PG_POOL'

/**
 * Pool compartido hacia la MISMA base Neon que usa el backend .NET.
 * Es global para que cualquier módulo pueda inyectar PG_POOL.
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL
        if (!connectionString) {
          throw new Error('Falta DATABASE_URL en el entorno (.env.local de la raíz).')
        }
        return new Pool({
          connectionString,
          // Neon exige TLS.
          ssl: { rejectUnauthorized: false },
          max: 5,
        })
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
