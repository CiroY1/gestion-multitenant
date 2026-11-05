import { Route } from '@angular/router'
import { Bebes } from './bebes/bebes'
import { Calendario } from './calendario/calendario'
import { Bonos } from './bonos/bonos'
import { Citas } from './citas/citas'
import { Eventos } from './eventos/eventos'
import { Paquetes } from './paquetes/paquetes'
import { Reportes } from './reportes/reportes'
import { Salas } from './salas/salas'
import { Servicios } from './servicios/servicios'
import { Tareas } from './tareas/tareas'
import { Trabajadores } from './trabajadores/trabajadores'

export const SPA_ROUTES: Route[] = [
  { path: '', redirectTo: 'calendario', pathMatch: 'full' },
  { path: 'calendario', component: Calendario, data: { title: 'Agenda' } },
  { path: 'reportes', component: Reportes, data: { title: 'Reportes' } },
  { path: 'servicios', component: Servicios, data: { title: 'Servicios' } },
  { path: 'citas', component: Citas, data: { title: 'Citas' } },
  { path: 'eventos', component: Eventos, data: { title: 'Eventos' } },
  { path: 'bebes', component: Bebes, data: { title: 'Bebés' } },
  { path: 'salas', component: Salas, data: { title: 'Salas' } },
  { path: 'trabajadores', component: Trabajadores, data: { title: 'Trabajadores' } },
  { path: 'tareas', component: Tareas, data: { title: 'Tareas' } },
  { path: 'paquetes', component: Paquetes, data: { title: 'Paquetes' } },
  { path: 'bonos', component: Bonos, data: { title: 'Bonos' } },
]
