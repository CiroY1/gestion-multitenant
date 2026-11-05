import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ModSpaGuard } from './mod-spa.guard'
import { ServiciosController } from './servicios.controller'

/** Módulo de negocio spa-bebés. Vive en el segundo backend (NestJS). */
@Module({
  imports: [AuthModule],
  controllers: [ServiciosController],
  providers: [ModSpaGuard],
})
export class SpaModule {}
