import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { CookieService } from 'ngx-cookie-service'
import { environment } from '@/environments/environment'

interface LoginResponse {
  token: string
  expira: string
  usuario: {
    email: string
    rol: string
    empresa: string
    tenantId: string
    esSuperAdmin?: boolean
  }
  modulos: { inventario: boolean; spa: boolean }
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  usuario: LoginResponse['usuario'] | null = null
  modulos: LoginResponse['modulos'] | null = null

  /** ¿El usuario de la sesión es administrador? */
  get esAdmin(): boolean {
    return this.usuario?.rol === 'admin'
  }

  /** ¿Super-admin de plataforma? (gestiona todas las empresas) */
  get esSuperAdmin(): boolean {
    return this.usuario?.esSuperAdmin === true
  }

  public readonly authSessionKey = '_REBACK_AUTH_SESSION_KEY_'
  private readonly userKey = '_REBACK_USER_'
  private cookieService = inject(CookieService)

  constructor(private http: HttpClient) {
    this.restore()
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((res) => {
          // login correcto si la respuesta trae token
          if (res && res.token) {
            this.saveSession(res.token)
            this.usuario = res.usuario
            this.modulos = res.modulos
            try {
              localStorage.setItem(
                this.userKey,
                JSON.stringify({ usuario: res.usuario, modulos: res.modulos })
              )
            } catch {}
          }
          return res
        })
      )
  }

  logout(): void {
    this.removeSession()
    this.usuario = null
    this.modulos = null
    try {
      localStorage.removeItem(this.userKey)
    } catch {}
  }

  private readonly tokenKey = '_REBACK_TOKEN_'

  get session(): string {
    // localStorage es por-origen (visible en todas las rutas); el cookie es respaldo.
    try {
      const t = localStorage.getItem(this.tokenKey)
      if (t) return t
    } catch {}
    return this.cookieService.get(this.authSessionKey)
  }

  saveSession(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token)
    } catch {}
    this.cookieService.set(this.authSessionKey, token, {
      path: '/',
      sameSite: 'Lax',
    })
  }

  removeSession(): void {
    try {
      localStorage.removeItem(this.tokenKey)
    } catch {}
    this.cookieService.delete(this.authSessionKey, '/')
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(this.userKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        this.usuario = parsed.usuario ?? null
        this.modulos = parsed.modulos ?? null
      }
    } catch {}
  }
}
