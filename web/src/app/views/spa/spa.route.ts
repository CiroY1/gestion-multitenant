import { Route } from '@angular/router'
import { Bebes } from './bebes/bebes'
import { Calendario } from './calendario/calendario'
import { Citas } from './citas/citas'
import { Servicios } from './servicios/servicios'
import { Tareas } from './tareas/tareas'
import { Trabajadores } from './trabajadores/trabajadores'

export const SPA_ROUTES: Route[] = [
  { path: '', redirectTo: 'calendario', pathMatch: 'full' },
  { path: 'calendario', component: Calendario, data: { title: 'Agenda' } },
  { path: 'servicios', component: Servicios, data: { title: 'Servicios' } },
  { path: 'citas', component: Citas, data: { title: 'Citas' } },
  { path: 'bebes', component: Bebes, data: { title: 'Bebés' } },
  { path: 'trabajadores', component: Trabajadores, data: { title: 'Trabajadores' } },
  { path: 'tareas', component: Tareas, data: { title: 'Tareas' } },
]
