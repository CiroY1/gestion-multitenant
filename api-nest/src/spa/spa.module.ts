import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ModSpaGuard } from './mod-spa.guard'
import { RolesGuard } from '../auth/roles.guard'
import { CitasController } from './citas.controller'
import { ServiciosController } from './servicios.controller'
import { TareasController } from './tareas.controller'
import { TrabajadoresController } from './trabajadores.controller'

/** Módulo de negocio spa-bebés. Vive en el segundo backend (NestJS). */
@Module({
  imports: [AuthModule],
  controllers: [
    ServiciosController,
    CitasController,
    TrabajadoresController,
    TareasController,
  ],
  providers: [ModSpaGuard, RolesGuard],
})
export class SpaModule {}
