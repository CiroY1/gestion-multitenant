import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ModSpaGuard } from './mod-spa.guard'
import { RolesGuard } from '../auth/roles.guard'
import { BebesController } from './bebes.controller'
import { BonosController } from './bonos.controller'
import { CitasController } from './citas.controller'
import { EventosController } from './eventos.controller'
import { PaquetesController } from './paquetes.controller'
import { ReportesController } from './reportes.controller'
import { SalasController } from './salas.controller'
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
    BebesController,
    SalasController,
    EventosController,
    PaquetesController,
    BonosController,
    ReportesController,
  ],
  providers: [ModSpaGuard, RolesGuard],
})
export class SpaModule {}
