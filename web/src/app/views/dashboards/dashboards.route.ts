import { Route } from '@angular/router'
import { Analytics } from './analytics/analytics'
import { Finance } from './finance/finance'
import { Sales } from './sales/sales'

export const DASHBOARD_ROUTES: Route[] = [
  {
    path: 'analytics',
    component: Analytics,
    data: { title: 'Analytics' },
  },
  {
    path: 'finance',
    component: Finance,
    data: { title: 'Finance' },
  },
  {
    path: 'sales',
    component: Sales,
    data: { title: 'Sales' },
  },
]
