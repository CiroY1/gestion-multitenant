import { environment } from '@/environments/environment'
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AuthenticationService } from '../services/auth.service'

/**
 * El JWT viaja en una cookie HttpOnly (no accesible desde JS). Para que el
 * navegador la envíe a la API (cross-origin), marcamos withCredentials en las
 * peticiones a ambos backends. Si la API responde 401 (cookie inválida/expirada)
 * limpiamos el estado local y redirigimos al login.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthenticationService)
  const router = inject(Router)
  const esApi =
    req.url.startsWith(environment.apiUrl) ||
    req.url.startsWith(environment.nestApiUrl)

  if (esApi) {
    req = req.clone({ withCredentials: true })
  }

  return next(req).pipe(
    catchError((err) => {
      if (esApi && err?.status === 401) {
        auth.logoutLocal()
        router.navigate(['/auth/sign-in'])
      }
      return throwError(() => err)
    })
  )
}
