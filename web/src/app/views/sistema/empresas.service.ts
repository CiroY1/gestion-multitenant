import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Observable } from 'rxjs'
import { environment } from '@/environments/environment'

export interface Empresa {
  id: string
  nombre: string
  moduloInventario: boolean
  moduloSpa: boolean
  usuarios: number
}

export interface NuevaEmpresa {
  id: string
  nombre: string
  moduloInventario: boolean
  moduloSpa: boolean
}

export interface EditarEmpresa {
  nombre: string
  moduloInventario: boolean
  moduloSpa: boolean
}

export interface UsuarioEmpresa {
  id: number
  email: string
  rol: string
  activo: boolean
  esSuperAdmin: boolean
}

export interface NuevoUsuarioEmpresa {
  email: string
  password: string
  rol: string
}

/**
 * Gestión de empresas (tenants) y sus módulos. Vive en el backend .NET.
 * Solo super-admin de plataforma (el backend exige la política SuperAdmin).
 */
@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private http = inject(HttpClient)
  private base = `${environment.apiUrl}/empresas`

  getEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.base)
  }

  crear(dto: NuevaEmpresa): Observable<{ id: string; ok: boolean }> {
    return this.http.post<{ id: string; ok: boolean }>(this.base, dto)
  }

  actualizar(id: string, dto: EditarEmpresa): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.base}/${id}`, dto)
  }

  // ---- Usuarios de una empresa ----

  getUsuarios(empresaId: string): Observable<UsuarioEmpresa[]> {
    return this.http.get<UsuarioEmpresa[]>(`${this.base}/${empresaId}/usuarios`)
  }

  crearUsuario(
    empresaId: string,
    dto: NuevoUsuarioEmpresa
  ): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(
      `${this.base}/${empresaId}/usuarios`,
      dto
    )
  }

  actualizarUsuario(
    empresaId: string,
    uid: number,
    dto: { rol: string; activo: boolean }
  ): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(
      `${this.base}/${empresaId}/usuarios/${uid}`,
      dto
    )
  }

  resetPassword(
    empresaId: string,
    uid: number,
    password: string
  ): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.base}/${empresaId}/usuarios/${uid}/password`,
      { password }
    )
  }

  eliminarUsuario(empresaId: string, uid: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/${empresaId}/usuarios/${uid}`
    )
  }
}
