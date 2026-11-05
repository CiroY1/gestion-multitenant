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
  salaId: number | null
  salaNombre: string
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
  salaId?: number | null
  bebeNombre?: string
  fechaHora: string
  notas?: string
}

export interface Sala {
  id: number
  nombre: string
  activa: boolean
}

export interface NuevaSala {
  nombre: string
  activa?: boolean
}

export interface Evento {
  id: number
  titulo: string
  fechaHora: string
  duracionMin: number
  cupo: number
  trabajadorId: number | null
  trabajadorNombre: string
  salaId: number | null
  salaNombre: string
  notas: string
  inscritos: number
}

export interface NuevoEvento {
  titulo: string
  fechaHora: string
  duracionMin: number
  cupo: number
  trabajadorId?: number | null
  salaId?: number | null
  notas?: string
}

export interface Inscripcion {
  id: number
  bebeId: number | null
  bebeNombre: string
}

export interface Paquete {
  id: number
  nombre: string
  sesiones: number
  precio: number
  activo: boolean
}

export interface NuevoPaquete {
  nombre: string
  sesiones: number
  precio: number
  activo?: boolean
}

export interface Bono {
  id: number
  clienteId: number | null
  clienteNombre: string
  paqueteNombre: string
  sesionesTotal: number
  sesionesRestantes: number
  precio: number
  creadoEn: string
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

export interface Bebe {
  id: number
  nombre: string
  clienteId: number | null
  clienteNombre: string
  fechaNacimiento: string // YYYY-MM-DD
  peso: number | null
  alergias: string
  notas: string
}

export interface NuevoBebe {
  nombre: string
  clienteId?: number | null
  fechaNacimiento: string
  peso?: number | null
  alergias?: string
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

  // --- Bebés (ficha) ---

  getBebes(): Observable<Bebe[]> {
    return this.http.get<Bebe[]>(`${this.base}/bebes`)
  }

  crearBebe(dto: NuevoBebe): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/bebes`, dto)
  }

  actualizarBebe(id: number, dto: NuevoBebe): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/bebes/${id}`, dto)
  }

  eliminarBebe(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/bebes/${id}`)
  }

  // --- Salas / recursos ---

  getSalas(): Observable<Sala[]> {
    return this.http.get<Sala[]>(`${this.base}/salas`)
  }

  crearSala(dto: NuevaSala): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/salas`, dto)
  }

  actualizarSala(id: number, dto: NuevaSala): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/salas/${id}`, dto)
  }

  eliminarSala(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/salas/${id}`)
  }

  // --- Eventos / clases grupales ---

  getEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.base}/eventos`)
  }

  crearEvento(dto: NuevoEvento): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/eventos`, dto)
  }

  eliminarEvento(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/eventos/${id}`)
  }

  getInscripciones(eventoId: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.base}/eventos/${eventoId}/inscripciones`)
  }

  inscribir(eventoId: number, bebeId: number): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(
      `${this.base}/eventos/${eventoId}/inscribir`,
      { bebeId }
    )
  }

  desinscribir(eventoId: number, insId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/eventos/${eventoId}/inscripciones/${insId}`
    )
  }

  // --- Paquetes (catálogo de bonos) ---

  getPaquetes(): Observable<Paquete[]> {
    return this.http.get<Paquete[]>(`${this.base}/paquetes`)
  }

  crearPaquete(dto: NuevoPaquete): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/paquetes`, dto)
  }

  actualizarPaquete(id: number, dto: NuevoPaquete): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/paquetes/${id}`, dto)
  }

  eliminarPaquete(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/paquetes/${id}`)
  }

  // --- Bonos vendidos ---

  getBonos(): Observable<Bono[]> {
    return this.http.get<Bono[]>(`${this.base}/bonos`)
  }

  venderBono(clienteId: number, paqueteId: number): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(`${this.base}/bonos`, {
      clienteId,
      paqueteId,
    })
  }

  consumirBono(id: number): Observable<{ ok: boolean; restantes: number }> {
    return this.http.post<{ ok: boolean; restantes: number }>(
      `${this.base}/bonos/${id}/consumir`,
      {}
    )
  }

  eliminarBono(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/bonos/${id}`)
  }
}
