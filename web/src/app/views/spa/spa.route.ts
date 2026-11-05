import { Route } from '@angular/router'
import { Servicios } from './servicios/servicios'

export const SPA_ROUTES: Route[] = [
  { path: '', redirectTo: 'servicios', pathMatch: 'full' },
  { path: 'servicios', component: Servicios, data: { title: 'Servicios' } },
]
