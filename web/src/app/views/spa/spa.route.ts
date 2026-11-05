import { Route } from '@angular/router'
import { Citas } from './citas/citas'
import { Servicios } from './servicios/servicios'
import { Tareas } from './tareas/tareas'
import { Trabajadores } from './trabajadores/trabajadores'

export const SPA_ROUTES: Route[] = [
  { path: '', redirectTo: 'servicios', pathMatch: 'full' },
  { path: 'servicios', component: Servicios, data: { title: 'Servicios' } },
  { path: 'citas', component: Citas, data: { title: 'Citas' } },
  { path: 'trabajadores', component: Trabajadores, data: { title: 'Trabajadores' } },
  { path: 'tareas', component: Tareas, data: { title: 'Tareas' } },
]
