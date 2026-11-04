import type { Route } from '@angular/router'
import { Productos } from './productos/productos'
import { Recepciones } from './recepciones/recepciones'

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
]
