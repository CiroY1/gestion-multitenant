import { Route } from '@angular/router'
import { Comingsoon } from './comingsoon/comingsoon'
import { Error4042 } from './error-404-2/error-404-2'
import { Error404 } from './error-404/error-404'
import { Maintenance } from './maintenance/maintenance'

export const OTHER_PAGES_ROUTES: Route[] = [
  {
    path: 'coming-soon',
    component: Comingsoon,
    data: { title: 'Coming Soon' },
  },
  {
    path: 'maintenance',
    component: Maintenance,
    data: { title: 'Maintenance' },
  },
  {
    path: 'error-404',
    component: Error404,
    data: { title: 'Page Not Found - 404' },
  },
  {
    path: 'error-404-2',
    component: Error4042,
    data: { title: 'Page Not Found - 404' },
  },
]
