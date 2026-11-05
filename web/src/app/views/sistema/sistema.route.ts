import { Route } from '@angular/router'
import { Estado } from './estado/estado'
import { Usuarios } from './usuarios/usuarios'

export const SISTEMA_ROUTES: Route[] = [
  { path: '', redirectTo: 'estado', pathMatch: 'full' },
  { path: 'estado', component: Estado, data: { title: 'Estado de servicios' } },
  { path: 'usuarios', component: Usuarios, data: { title: 'Usuarios' } },
]
