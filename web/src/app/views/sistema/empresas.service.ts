import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Observable } from 'rxjs'
import { environment } from '@/environments/environment'

/** Datos de identidad/personalización comunes a crear y editar. */
export interface EmpresaPerfil {
  logoUrl?: string | null
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  sitioWeb?: string | null
  nit?: string | null
  razonSocial?: string | null
}

export interface Empresa extends EmpresaPerfil {
  id: string
  nombre: string
  moduloInventario: boolean
  moduloSpa: boolean
  usuarios: number
}

export interface NuevaEmpresa extends EmpresaPerfil {
  id: string
  nombre: string
  moduloInventario: boolean
  moduloSpa: boolean
}

export interface EditarEmpresa extends EmpresaPerfil {
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

  /** ¿Está configurado Cloudinary para subir imágenes? */
  get cloudinaryListo(): boolean {
    const c = environment.cloudinary
    return !!c?.cloudName && !!c?.uploadPreset
  }

  /**
   * Sube una imagen a Cloudinary (unsigned) y devuelve su URL (secure_url).
   * La BD solo guarda esa URL; la imagen vive en Cloudinary.
   */
  async subirLogo(file: File): Promise<string> {
    const c = environment.cloudinary
    if (!c?.cloudName || !c?.uploadPreset) {
      throw new Error('Cloudinary no está configurado.')
    }
    const data = new FormData()
    data.append('file', file)
    data.append('upload_preset', c.uploadPreset)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${c.cloudName}/image/upload`,
      { method: 'POST', body: data }
    )
    if (!res.ok) throw new Error('No se pudo subir la imagen a Cloudinary.')
    const json = (await res.json()) as { secure_url?: string }
    if (!json.secure_url) throw new Error('Cloudinary no devolvió la URL.')
    return json.secure_url
  }

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
