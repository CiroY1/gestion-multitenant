import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { environment } from '@/environments/environment'

interface LoginResponse {
  ok?: boolean
  expira?: string
  usuario: {
    email: string
    rol: string
    empresa: string
    tenantId: string
    esSuperAdmin?: boolean
  }
  modulos: { inventario: boolean; spa: boolean }
}

/**
 * Autenticación por cookie HttpOnly: el JWT lo pone el backend en una cookie
 * HttpOnly (no accesible desde JS) y el navegador la envía sola en cada
 * petición (withCredentials, lo añade el interceptor). Aquí solo guardamos los
 * datos NO sensibles del usuario (para la UI), nunca el token.
 */
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

  /** Hay sesión si tenemos datos del usuario; el backend valida la cookie. */
  get estaAutenticado(): boolean {
    return !!this.usuario
  }

  private readonly userKey = '_REBACK_USER_'

  constructor(private http: HttpClient) {
    this.restore()
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((res) => {
          if (res && res.usuario) {
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

  /** Cierra sesión: pide al backend borrar la cookie y limpia el estado local. */
  logout(): void {
    // Fire-and-forget: el endpoint es anónimo y solo borra la cookie.
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {})
      .subscribe({ next: () => {}, error: () => {} })
    this.logoutLocal()
  }

  /** Limpia solo el estado local (p. ej. ante un 401), sin llamar al backend. */
  logoutLocal(): void {
    this.usuario = null
    this.modulos = null
    try {
      localStorage.removeItem(this.userKey)
    } catch {}
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
