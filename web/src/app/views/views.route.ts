import { Route } from '@angular/router'
import { Widgets } from './apps/widgets/widgets'
import { InvoiceDetails } from './invoices/invoice-details/invoice-details'
import { Invoices } from './invoices/invoices/invoices'

export const VIEW_ROUTES: Route[] = [
  {
    path: 'inventario',
    loadChildren: () =>
      import('./inventario/inventario.route').then(
        (mod) => mod.INVENTARIO_ROUTES
      ),
  },
  {
    path: 'terceros',
    loadChildren: () =>
      import('./terceros/terceros.route').then((mod) => mod.TERCEROS_ROUTES),
  },
  {
    path: 'sistema',
    loadChildren: () =>
      import('./sistema/sistema.route').then((mod) => mod.SISTEMA_ROUTES),
  },
  {
    path: 'pages',
    loadChildren: () =>
      import('./pages/pages.route').then((mod) => mod.PAGES_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboards/dashboards.route').then(
        (mod) => mod.DASHBOARD_ROUTES
      ),
  },
  {
    path: 'ecommerce',
    loadChildren: () =>
      import('./ecommerce/ecommerce.route').then((mod) => mod.ECOMMERCE_ROUTES),
  },
  {
    path: 'apps',
    loadChildren: () =>
      import('./apps/apps.route').then((mod) => mod.APPS_ROUTES),
  },
  {
    path: 'calendar',
    loadChildren: () =>
      import('./calendar/calendar.route').then((mod) => mod.CALENDAR_ROUTES),
  },
  {
    path: 'invoices',
    component: Invoices,
    data: { title: 'Invoices' },
  },
  {
    path: 'invoice/:id',
    component: InvoiceDetails,
    data: { title: 'Invoice Details' },
  },

  {
    path: 'widgets',
    component: Widgets,
    data: { title: 'Widgets' },
  },
  {
    path: 'ui',
    loadChildren: () => import('./ui/ui.route').then((mod) => mod.UI_ROUTES),
  },
  {
    path: 'advanced',
    loadChildren: () =>
      import('./advanced-ui/advanced.route').then((mod) => mod.ADVANCED_ROUTES),
  },
  {
    path: 'charts',
    loadChildren: () =>
      import('./charts/charts.route').then((mod) => mod.CHART_ROUTE),
  },
  {
    path: 'forms',
    loadChildren: () =>
      import('./forms/forms.route').then((mod) => mod.FOMRS_ROUTE),
  },
  {
    path: 'tables',
    loadChildren: () =>
      import('./tables/table.route').then((mod) => mod.TABLES_ROUTE),
  },
  {
    path: 'icons',
    loadChildren: () =>
      import('./icons/icons.route').then((mod) => mod.ICONS_ROUTES),
  },
  {
    path: 'maps',
    loadChildren: () => import('./map/map.route').then((mod) => mod.MAPS_ROUTE),
  },
]
