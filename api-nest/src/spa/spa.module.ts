import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ModSpaGuard } from './mod-spa.guard'
import { CitasController } from './citas.controller'
import { ServiciosController } from './servicios.controller'

/** Módulo de negocio spa-bebés. Vive en el segundo backend (NestJS). */
@Module({
  imports: [AuthModule],
  controllers: [ServiciosController, CitasController],
  providers: [ModSpaGuard],
})
export class SpaModule {}
