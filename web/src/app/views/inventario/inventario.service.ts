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

export type EstadoDocumento = 'Borrador' | 'Confirmado' | 'Anulado'

export interface Recepcion {
  id: number
  numero: string
  proveedor: string
  observaciones?: string
  fecha: string
  estado: EstadoDocumento
  total: number
  items: number
}

export interface Remision {
  id: number
  numero: string
  cliente: string
  observaciones?: string
  fecha: string
  estado: EstadoDocumento
  unidades: number
  items: number
}

export interface Receta {
  id: number
  nombre: string
  productoFinalId: number
  productoFinal?: string
  ingredientes: number
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

  getRecepciones(): Observable<Recepcion[]> {
    return this.http.get<Recepcion[]>(`${this.base}/recepciones`)
  }

  crearRecepcion(dto: {
    proveedor: string
    observaciones?: string
    lineas: { productoId: number; cantidad: number; costoUnitario: number }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/recepciones`, dto)
  }

  confirmarRecepcion(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/recepciones/${id}/confirmar`, {})
  }

  anularRecepcion(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/recepciones/${id}/anular`, {})
  }

  getRemisiones(): Observable<Remision[]> {
    return this.http.get<Remision[]>(`${this.base}/remisiones`)
  }

  crearRemision(dto: {
    cliente: string
    observaciones?: string
    lineas: { productoId: number; cantidad: number }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/remisiones`, dto)
  }

  confirmarRemision(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/remisiones/${id}/confirmar`, {})
  }

  anularRemision(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/remisiones/${id}/anular`, {})
  }

  getRecetas(): Observable<Receta[]> {
    return this.http.get<Receta[]>(`${this.base}/recetas`)
  }

  crearReceta(dto: {
    nombre: string
    productoFinalId: number
    ingredientes: { productoId: number; cantidad: number }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/recetas`, dto)
  }

  producir(recetaId: number, cantidad: number): Observable<unknown> {
    return this.http.post(`${this.base}/recetas/${recetaId}/producir`, { cantidad })
  }

  registrarMovimiento(dto: {
    productoId: number
    tipo: 'Entrada' | 'Salida'
    cantidad: number
  }): Observable<Movimiento> {
    return this.http.post<Movimiento>(`${this.base}/movimientos`, dto)
  }
}
