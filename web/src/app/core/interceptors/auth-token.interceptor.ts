import { environment } from '@/environments/environment'
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthenticationService } from '../services/auth.service'

/**
 * Añade el token JWT (Authorization: Bearer) a las peticiones dirigidas a la API,
 * tomándolo de la sesión guardada por AuthenticationService.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthenticationService)
  const token = auth.session

  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  }

  return next(req)
}
