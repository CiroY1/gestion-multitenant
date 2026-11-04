import type { Route } from '@angular/router'
import { Productos } from './productos/productos'
import { Recepciones } from './recepciones/recepciones'
import { Remisiones } from './remisiones/remisiones'

export const INVENTARIO_ROUTES: Route[] = [
  {
    path: 'productos',
    component: Productos,
    data: { title: 'Productos' },
  },
  {
    path: 'recepciones',
    component: Recepciones,
    data: { title: 'Recepciones' },
  },
  {
    path: 'remisiones',
    component: Remisiones,
    data: { title: 'Remisiones' },
  },
]
