import { RedirectCommand, Router, Routes, type UrlTree } from '@angular/router'
import { AuthLayout } from './layouts/auth-layout/auth-layout'
import { PrivateLayout } from './layouts/private-layout/private-layout'
import { AuthenticationService } from './core/services/auth.service'
import { inject } from '@angular/core'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/analytics',
    pathMatch: 'full',
  },
  {
    path: '',
    component: PrivateLayout,
    canActivate: [
      () => {
        const currentUser = inject(AuthenticationService).session
        const router: Router = inject(Router)
        if (currentUser) return true
        const urlTree: UrlTree = router.parseUrl('/auth/sign-in')
        return new RedirectCommand(urlTree, { skipLocationChange: true })
      },
    ],
    loadChildren: () =>
      import('./views/views.route').then((mod) => mod.VIEW_ROUTES),
  },
  {
    path: '',
    component: AuthLayout,
    loadChildren: () =>
      import('./views/other-pages/other-page.route').then(
        (mod) => mod.OTHER_PAGES_ROUTES
      ),
  },
  {
    path: 'auth',
    component: AuthLayout,
    loadChildren: () =>
      import('./views/auth/auth.route').then((mod) => mod.AUTH_ROUTES),
  },
]
