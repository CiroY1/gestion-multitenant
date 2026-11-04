import type { Route } from '@angular/router'
import { Productos } from './productos/productos'

export const INVENTARIO_ROUTES: Route[] = [
  {
    path: 'productos',
    component: Productos,
    data: { title: 'Productos' },
  },
]
