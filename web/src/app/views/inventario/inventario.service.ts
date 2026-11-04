import { environment } from '@/environments/environment'
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'

export interface Categoria {
  id: number
  nombre: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  categoriaId: number
  categoria?: string
}

export interface Movimiento {
  id: number
  productoId: number
  tipo: string
  cantidad: number
  fecha: string
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient)
  private base = environment.apiUrl

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias`)
  }

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.base}/productos`)
  }

  crearCategoria(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.base}/categorias`, { nombre })
  }

  crearProducto(dto: {
    nombre: string
    descripcion?: string
    precio: number
    stockInicial: number
    categoriaId: number
  }): Observable<Producto> {
    return this.http.post<Producto>(`${this.base}/productos`, dto)
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/productos/${id}`)
  }

  registrarMovimiento(dto: {
    productoId: number
    tipo: 'Entrada' | 'Salida'
    cantidad: number
  }): Observable<Movimiento> {
    return this.http.post<Movimiento>(`${this.base}/movimientos`, dto)
  }
}
