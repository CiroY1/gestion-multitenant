import { Route } from '@angular/router'
import { Citas } from './citas/citas'
import { Servicios } from './servicios/servicios'

export const SPA_ROUTES: Route[] = [
  { path: '', redirectTo: 'servicios', pathMatch: 'full' },
  { path: 'servicios', component: Servicios, data: { title: 'Servicios' } },
  { path: 'citas', component: Citas, data: { title: 'Citas' } },
]
