import { environment } from '@/environments/environment'
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AuthenticationService } from '../services/auth.service'

/**
 * Añade el token JWT (Authorization: Bearer) a las peticiones a la API y,
 * si la API responde 401 (token inválido/expirado), cierra sesión y
 * redirige al login en vez de dejar una sesión "zombie".
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthenticationService)
  const router = inject(Router)
  const token = auth.session
  const esApi = req.url.startsWith(environment.apiUrl)

  if (token && esApi) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  }

  return next(req).pipe(
    catchError((err) => {
      if (esApi && err?.status === 401) {
        auth.logout()
        router.navigate(['/auth/sign-in'])
      }
      return throwError(() => err)
    })
  )
}
