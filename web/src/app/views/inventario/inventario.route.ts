import type { Route } from '@angular/router'
import { Productos } from './productos/productos'
import { Recepciones } from './recepciones/recepciones'
import { Remisiones } from './remisiones/remisiones'
import { Recetas } from './recetas/recetas'
import { Notas } from './notas/notas'
import { KardexView } from './kardex/kardex'

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
  {
    path: 'recetas',
    component: Recetas,
    data: { title: 'Recetas' },
  },
  {
    path: 'notas',
    component: Notas,
    data: { title: 'Notas crédito/débito' },
  },
  {
    path: 'kardex',
    component: KardexView,
    data: { title: 'Kardex' },
  },
]
