import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Observable } from 'rxjs'
import { environment } from '@/environments/environment'

export interface ServicioSpa {
  id: number
  nombre: string
  descripcion: string
  duracionMin: number
  precio: number
  activo: boolean
  creadoEn: string
}

export interface NuevoServicio {
  nombre: string
  descripcion?: string
  duracionMin: number
  precio: number
  activo?: boolean
}

export type EstadoCita = 'Programada' | 'Atendida' | 'Cancelada'

export interface Cita {
  id: number
  servicioId: number
  servicioNombre: string
  clienteId: number | null
  clienteNombre: string
  bebeNombre: string
  fechaHora: string
  estado: EstadoCita
  notas: string
}

export interface NuevaCita {
  servicioId: number
  clienteId?: number | null
  clienteNombre?: string
  bebeNombre?: string
  fechaHora: string
  notas?: string
}

/**
 * Módulo spa-bebés: vive en el SEGUNDO backend (NestJS, puerto 5046).
 * El token lo adjunta el interceptor (mismo JWT para ambos backends).
 */
@Injectable({ providedIn: 'root' })
export class SpaService {
  private http = inject(HttpClient)
  private base = `${environment.nestApiUrl}/spa`

  getServicios(): Observable<ServicioSpa[]> {
    return this.http.get<ServicioSpa[]>(`${this.base}/servicios`)
  }

  crearServicio(dto: NuevoServicio): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/servicios`, dto)
  }

  eliminarServicio(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/servicios/${id}`)
  }

  // --- Agenda de citas ---

  getCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.base}/citas`)
  }

  crearCita(dto: NuevaCita): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/citas`, dto)
  }

  atenderCita(id: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/citas/${id}/atender`, {})
  }

  cancelarCita(id: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/citas/${id}/cancelar`, {})
  }
}
