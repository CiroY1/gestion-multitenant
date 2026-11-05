import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { join } from 'path'
import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { SistemaModule } from './sistema/sistema.module'
import { SpaModule } from './spa/spa.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Comparte el MISMO .env.local que el backend .NET (secretos en la raíz
      // del repo): JWT_SECRET y DATABASE_URL son los mismos para ambos backends.
      // __dirname en ejecución = api-nest/dist, así que subimos dos niveles.
      envFilePath: [join(__dirname, '..', '..', '.env.local')],
    }),
    DatabaseModule,
    AuthModule,
    SistemaModule,
    SpaModule,
  ],
})
export class AppModule {}
