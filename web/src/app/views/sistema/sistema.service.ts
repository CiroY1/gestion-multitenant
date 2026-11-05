import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Observable } from 'rxjs'
import { environment } from '@/environments/environment'

export interface NestIdentidad {
  backend: string
  usuario: {
    id: string
    email: string
    tenantId: string
    rol: string
    modInventario: boolean
    modSpa: boolean
  }
}

export interface NestDbCheck {
  backend: string
  tenant: string
  productos: number
  ok: boolean
}

export interface NestHealth {
  ok: boolean
  backend: string
  hora: string
}

/**
 * Habla con AMBOS backends. El token JWT lo adjunta el interceptor
 * (el mismo sirve para los dos porque comparten JWT_SECRET).
 */
@Injectable({ providedIn: 'root' })
export class SistemaService {
  private http = inject(HttpClient)
  private nest = environment.nestApiUrl
  // Raíz del backend .NET (sin el sufijo /api), donde vive /health/db.
  private netRoot = environment.apiUrl.replace(/\/api\/?$/, '')

  /** Salud del backend .NET (identidad + inventario). Público. */
  netHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.netRoot}/health/db`)
  }

  /** Salud del segundo backend (NestJS). Público. */
  nestHealth(): Observable<NestHealth> {
    return this.http.get<NestHealth>(`${this.nest}/sistema/health`)
  }

  /** Identidad que NestJS extrae del token (prueba del JWT compartido). */
  nestMe(): Observable<NestIdentidad> {
    return this.http.get<NestIdentidad>(`${this.nest}/sistema/me`)
  }

  /** Conteo de productos del tenant vía NestJS (prueba de base compartida). */
  nestDbCheck(): Observable<NestDbCheck> {
    return this.http.get<NestDbCheck>(`${this.nest}/sistema/db-check`)
  }
}
