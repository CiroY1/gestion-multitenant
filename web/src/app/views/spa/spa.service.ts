import { HttpClient, HttpParams } from '@angular/common/http'
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
  trabajadorId: number | null
  trabajadorNombre: string
  duracionMin: number
  bebeNombre: string
  fechaHora: string
  estado: EstadoCita
  notas: string
}

export interface NuevaCita {
  servicioId: number
  clienteId?: number | null
  clienteNombre?: string
  trabajadorId?: number | null
  bebeNombre?: string
  fechaHora: string
  notas?: string
}

export interface Trabajador {
  id: number
  nombre: string
  rol: string
  email: string
  activo: boolean
}

export interface NuevoTrabajador {
  nombre: string
  rol?: string
  email?: string
  activo?: boolean
}

export type EstadoTarea = 'Pendiente' | 'EnProgreso' | 'Hecha'

export interface Tarea {
  id: number
  titulo: string
  trabajadorId: number
  trabajadorNombre: string
  fechaHora: string
  estado: EstadoTarea
  notas: string
}

export interface NuevaTarea {
  titulo: string
  trabajadorId: number
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

  actualizarServicio(id: number, dto: NuevoServicio): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/servicios/${id}`, dto)
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

  // --- Trabajadores ---

  getTrabajadores(): Observable<Trabajador[]> {
    return this.http.get<Trabajador[]>(`${this.base}/trabajadores`)
  }

  crearTrabajador(dto: NuevoTrabajador): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/trabajadores`, dto)
  }

  actualizarTrabajador(id: number, dto: NuevoTrabajador): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/trabajadores/${id}`, dto)
  }

  eliminarTrabajador(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/trabajadores/${id}`)
  }

  // --- Tareas (agenda de trabajo) ---

  getTareas(trabajadorId?: number): Observable<Tarea[]> {
    let params = new HttpParams()
    if (trabajadorId) params = params.set('trabajadorId', trabajadorId)
    return this.http.get<Tarea[]>(`${this.base}/tareas`, { params })
  }

  crearTarea(dto: NuevaTarea): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/tareas`, dto)
  }

  iniciarTarea(id: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/tareas/${id}/iniciar`, {})
  }

  completarTarea(id: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/tareas/${id}/completar`, {})
  }
}
