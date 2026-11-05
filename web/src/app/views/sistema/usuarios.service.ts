import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Observable } from 'rxjs'
import { environment } from '@/environments/environment'

export type RolUsuario = 'admin' | 'operador'

export interface Usuario {
  id: number
  email: string
  rol: RolUsuario
  activo: boolean
}

export interface NuevoUsuario {
  email: string
  password: string
  rol: RolUsuario
}

/**
 * Gestión de usuarios. Vive en el backend .NET (núcleo de identidad). Solo
 * administradores: el propio backend exige el rol "admin" (403 si no lo es).
 */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient)
  private base = `${environment.apiUrl}/usuarios`

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base)
  }

  crear(dto: NuevoUsuario): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(this.base, dto)
  }

  actualizar(
    id: number,
    dto: { rol: RolUsuario; activo: boolean }
  ): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/${id}`, dto)
  }

  resetPassword(id: number, password: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/${id}/password`, { password })
  }

  eliminar(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`)
  }
}
