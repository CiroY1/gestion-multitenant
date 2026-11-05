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
  costoPromedio: number
  categoriaId: number
  categoria?: string
}

export interface KardexLinea {
  fecha: string
  documentoTipo?: string
  documentoNumero?: string
  concepto?: string
  entrada: number
  salida: number
  costoUnitario: number
  saldoCantidad: number
  costoPromedio: number
  saldoValor: number
}

export interface Kardex {
  productoId: number
  producto: string
  stock: number
  costoPromedio: number
  valor: number
  movimientos: KardexLinea[]
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
  ordenCompra?: string
}

export type EstadoOrden =
  | 'Borrador'
  | 'Aprobada'
  | 'Parcial'
  | 'Recibida'
  | 'Cerrada'
  | 'Anulada'

export interface OrdenCompra {
  id: number
  numero: string
  proveedor: string
  observaciones?: string
  fecha: string
  estado: EstadoOrden
  total: number
  items: number
  pendiente: number
}

export interface OrdenLinea {
  lineaId: number
  productoId: number
  producto?: string
  cantidad: number
  costoUnitario: number
  recibida: number
  pendiente: number
}

export interface OrdenCompraDetalle {
  id: number
  numero: string
  proveedor: string
  observaciones?: string
  fecha: string
  estado: EstadoOrden
  lineas: OrdenLinea[]
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
  pedidoVenta?: string
}

export type EstadoPedido =
  | 'Borrador'
  | 'Aprobado'
  | 'Parcial'
  | 'Despachado'
  | 'Cerrado'
  | 'Anulado'

export interface PedidoVenta {
  id: number
  numero: string
  cliente: string
  observaciones?: string
  fecha: string
  estado: EstadoPedido
  total: number
  items: number
  pendiente: number
}

export interface PedidoLinea {
  lineaId: number
  productoId: number
  producto?: string
  cantidad: number
  precioUnitario: number
  despachada: number
  pendiente: number
}

export interface PedidoVentaDetalle {
  id: number
  numero: string
  cliente: string
  observaciones?: string
  fecha: string
  estado: EstadoPedido
  lineas: PedidoLinea[]
}

export interface Receta {
  id: number
  nombre: string
  productoFinalId: number
  productoFinal?: string
  ingredientes: number
}

export type TipoNota = 'Credito' | 'Debito'

export interface Nota {
  id: number
  numero: string
  tipo: TipoNota
  documentoOrigen?: string
  motivo?: string
  fecha: string
  estado: EstadoDocumento
  total: number
  items: number
}

/** Línea de un documento origen (recepción o remisión) usada al crear una nota. */
export interface DocumentoLinea {
  productoId: number
  producto?: string
  cantidad: number
  costoUnitario?: number
}

/** Cabecera + líneas de un documento origen confirmado. */
export interface DocumentoDetalle {
  id: number
  numero: string
  estado: EstadoDocumento
  lineas: DocumentoLinea[]
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
    ordenCompraId?: number
    lineas: {
      productoId: number
      cantidad: number
      costoUnitario: number
      ordenCompraLineaId?: number
    }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/recepciones`, dto)
  }

  getOrdenesCompra(): Observable<OrdenCompra[]> {
    return this.http.get<OrdenCompra[]>(`${this.base}/ordenescompra`)
  }

  getOrdenCompra(id: number): Observable<OrdenCompraDetalle> {
    return this.http.get<OrdenCompraDetalle>(`${this.base}/ordenescompra/${id}`)
  }

  crearOrdenCompra(dto: {
    proveedor: string
    observaciones?: string
    lineas: { productoId: number; cantidad: number; costoUnitario: number }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/ordenescompra`, dto)
  }

  aprobarOrdenCompra(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/ordenescompra/${id}/aprobar`, {})
  }

  cerrarOrdenCompra(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/ordenescompra/${id}/cerrar`, {})
  }

  anularOrdenCompra(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/ordenescompra/${id}/anular`, {})
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
    pedidoVentaId?: number
    lineas: { productoId: number; cantidad: number; pedidoVentaLineaId?: number }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/remisiones`, dto)
  }

  getPedidosVenta(): Observable<PedidoVenta[]> {
    return this.http.get<PedidoVenta[]>(`${this.base}/pedidosventa`)
  }

  getPedidoVenta(id: number): Observable<PedidoVentaDetalle> {
    return this.http.get<PedidoVentaDetalle>(`${this.base}/pedidosventa/${id}`)
  }

  crearPedidoVenta(dto: {
    cliente: string
    observaciones?: string
    lineas: { productoId: number; cantidad: number; precioUnitario: number }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/pedidosventa`, dto)
  }

  aprobarPedidoVenta(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/pedidosventa/${id}/aprobar`, {})
  }

  cerrarPedidoVenta(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/pedidosventa/${id}/cerrar`, {})
  }

  anularPedidoVenta(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/pedidosventa/${id}/anular`, {})
  }

  confirmarRemision(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/remisiones/${id}/confirmar`, {})
  }

  anularRemision(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/remisiones/${id}/anular`, {})
  }

  getRecepcion(id: number): Observable<DocumentoDetalle> {
    return this.http.get<DocumentoDetalle>(`${this.base}/recepciones/${id}`)
  }

  getRemision(id: number): Observable<DocumentoDetalle> {
    return this.http.get<DocumentoDetalle>(`${this.base}/remisiones/${id}`)
  }

  getKardex(productoId: number): Observable<Kardex> {
    return this.http.get<Kardex>(`${this.base}/kardex/${productoId}`)
  }

  /** Descarga el PDF de un documento (el interceptor agrega el token). */
  abrirPdf(recurso: string, id: number, nombre: string): void {
    this.http
      .get(`${this.base}/documentos/${recurso}/${id}/pdf`, { responseType: 'blob' })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${nombre}.pdf`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      })
  }

  getNotas(): Observable<Nota[]> {
    return this.http.get<Nota[]>(`${this.base}/notas`)
  }

  crearNota(dto: {
    tipo: TipoNota
    documentoOrigenId: number
    motivo?: string
    lineas: { productoId: number; cantidad: number }[]
  }): Observable<unknown> {
    return this.http.post(`${this.base}/notas`, dto)
  }

  confirmarNota(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/notas/${id}/confirmar`, {})
  }

  anularNota(id: number): Observable<unknown> {
    return this.http.post(`${this.base}/notas/${id}/anular`, {})
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
