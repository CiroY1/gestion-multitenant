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
}
