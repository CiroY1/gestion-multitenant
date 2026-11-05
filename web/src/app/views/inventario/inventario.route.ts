import type { Route } from '@angular/router'
import { Productos } from './productos/productos'
import { Recepciones } from './recepciones/recepciones'
import { Remisiones } from './remisiones/remisiones'
import { Recetas } from './recetas/recetas'
import { Notas } from './notas/notas'
import { KardexView } from './kardex/kardex'
import { Ajustes } from './ajustes/ajustes'
import { OrdenesCompra } from './ordenes/ordenes'
import { PedidosVenta } from './pedidos/pedidos'
import { Bodegas } from './bodegas/bodegas'
import { Existencias } from './existencias/existencias'
import { Traslados } from './traslados/traslados'
import { Unidades } from './unidades/unidades'
import { Vencimientos } from './vencimientos/vencimientos'

export const INVENTARIO_ROUTES: Route[] = [
  {
    path: 'productos',
    component: Productos,
    data: { title: 'Productos' },
  },
  {
    path: 'ordenes-compra',
    component: OrdenesCompra,
    data: { title: 'Órdenes de compra' },
  },
  {
    path: 'recepciones',
    component: Recepciones,
    data: { title: 'Recepciones' },
  },
  {
    path: 'pedidos-venta',
    component: PedidosVenta,
    data: { title: 'Pedidos de venta' },
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
  {
    path: 'ajustes',
    component: Ajustes,
    data: { title: 'Ajustes' },
  },
  {
    path: 'bodegas',
    component: Bodegas,
    data: { title: 'Bodegas' },
  },
  {
    path: 'existencias',
    component: Existencias,
    data: { title: 'Existencias' },
  },
  {
    path: 'traslados',
    component: Traslados,
    data: { title: 'Traslados' },
  },
  {
    path: 'unidades',
    component: Unidades,
    data: { title: 'Unidades de medida' },
  },
  {
    path: 'vencimientos',
    component: Vencimientos,
    data: { title: 'Vencimientos' },
  },
]
