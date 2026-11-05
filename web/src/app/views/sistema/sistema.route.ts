import { Route } from '@angular/router'
import { Estado } from './estado/estado'

export const SISTEMA_ROUTES: Route[] = [
  { path: '', redirectTo: 'estado', pathMatch: 'full' },
  { path: 'estado', component: Estado, data: { title: 'Estado de servicios' } },
]
