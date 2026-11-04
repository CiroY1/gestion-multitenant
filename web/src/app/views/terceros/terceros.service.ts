import { environment } from '@/environments/environment'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'

export interface Proveedor {
  id: number
  nombre: string
  nit?: string
  telefono?: string
  email?: string
}

export interface Cliente {
  id: number
  nombre: string
  documento?: string
  telefono?: string
  email?: string
}

@Injectable({ providedIn: 'root' })
export class TercerosService {
  private http = inject(HttpClient)
  private base = environment.apiUrl

  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.base}/proveedores`)
  }
  crearProveedor(dto: Omit<Proveedor, 'id'>): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.base}/proveedores`, dto)
  }
  actualizarProveedor(id: number, dto: Omit<Proveedor, 'id'>): Observable<void> {
    return this.http.put<void>(`${this.base}/proveedores/${id}`, dto)
  }
  eliminarProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/proveedores/${id}`)
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.base}/clientes`)
  }
  crearCliente(dto: Omit<Cliente, 'id'>): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.base}/clientes`, dto)
  }
  actualizarCliente(id: number, dto: Omit<Cliente, 'id'>): Observable<void> {
    return this.http.put<void>(`${this.base}/clientes/${id}`, dto)
  }
  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clientes/${id}`)
  }
}
