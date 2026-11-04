import type { Route } from '@angular/router'
import { Proveedores } from './proveedores/proveedores'
import { Clientes } from './clientes/clientes'

export const TERCEROS_ROUTES: Route[] = [
  {
    path: 'proveedores',
    component: Proveedores,
    data: { title: 'Proveedores' },
  },
  {
    path: 'clientes',
    component: Clientes,
    data: { title: 'Clientes' },
  },
]
