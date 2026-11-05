import { Global, Module } from '@nestjs/common'
import { Pool } from 'pg'
import { MigrationsService } from './migrations.service'
import { PG_POOL } from './pg.token'

// Se re-exporta para que el resto del código pueda seguir importándolo desde aquí.
export { PG_POOL } from './pg.token'

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
    MigrationsService,
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
