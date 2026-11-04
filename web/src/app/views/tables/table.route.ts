import type { Route } from '@angular/router'
import { Basic } from './basic/basic'
import { Datatable } from './datatable/datatable'

export const TABLES_ROUTE: Route[] = [
  {
    path: 'basic',
    component: Basic,
    data: { title: 'Basic Tables' },
  },
  {
    path: 'datatable',
    component: Datatable,
    data: { title: 'Data Tables' },
  },
]
