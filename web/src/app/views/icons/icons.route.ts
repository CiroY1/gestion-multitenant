import type { Route } from '@angular/router'
import { Boxicons } from './boxicons/boxicons'
import { Iconamoon } from './iconamoon/iconamoon'

export const ICONS_ROUTES: Route[] = [
  {
    path: 'boxicons',
    component: Boxicons,
    data: { title: 'Boxicons' },
  },
  {
    path: 'iconamoon',
    component: Iconamoon,
    data: { title: 'IconaMoon' },
  },
]
