import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type PedidoVenta,
  type Producto,
} from '../inventario.service'
import { TercerosService, type Cliente } from '../../terceros/terceros.service'

interface LineaForm {
  productoId: number
  cantidad: number
  precioUnitario: number
}

interface LineaDespachar {
  lineaId: number
  producto: string
  pendiente: number
  cantidad: number
  incluir: boolean
}

@Component({
  selector: 'app-inventario-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './pedidos.html',
})
export class PedidosVenta implements OnInit {
  private inv = inject(InventarioService)
  private terceros = inject(TercerosService)

  pedidos = signal<PedidoVenta[]>([])
  productos = signal<Producto[]>([])
  clientes = signal<Cliente[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  procesando = signal<number | null>(null)

  // Crear pedido
  mostrarForm = signal(false)
  guardando = signal(false)
  errorForm = signal<string | null>(null)
  cliente = ''
  observaciones = ''
  lineas: LineaForm[] = []

  get total(): number {
    return this.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0)
  }

  // Despachar contra pedido
  mostrarDespachar = signal(false)
  despachando = signal(false)
  errorDespachar = signal<string | null>(null)
  pedidoDespacharNumero = signal('')
  private pedidoDespacharId: number | null = null
  lineasDespachar = signal<LineaDespachar[]>([])

  ngOnInit(): void {
    this.cargar()
    this.inv.getProductos().subscribe({
      next: (p) => this.productos.set(p),
      error: () => {},
    })
    this.terceros.getClientes().subscribe({
      next: (c) => this.clientes.set(c),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getPedidosVenta().subscribe({
      next: (d) => {
        this.pedidos.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  private nuevaLinea(): LineaForm {
    const p = this.productos()[0]
    return { productoId: p?.id ?? 0, cantidad: 1, precioUnitario: p?.precio ?? 0 }
  }

  // --- Crear ---
  abrirForm(): void {
    this.cliente = ''
    this.observaciones = ''
    this.errorForm.set(null)
    this.lineas = [this.nuevaLinea()]
    this.mostrarForm.set(true)
  }

  agregarLinea(): void {
    this.lineas.push(this.nuevaLinea())
  }

  quitarLinea(i: number): void {
    this.lineas.splice(i, 1)
  }

  guardar(): void {
    if (!this.cliente.trim() || this.lineas.length === 0) return
    this.guardando.set(true)
    this.errorForm.set(null)
    this.inv
      .crearPedidoVenta({
        cliente: this.cliente,
        observaciones: this.observaciones,
        lineas: this.lineas,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false)
          this.mostrarForm.set(false)
          this.cargar()
        },
        error: (e) => {
          this.guardando.set(false)
          this.errorForm.set(typeof e?.error === 'string' ? e.error : 'No se pudo crear el pedido.')
        },
      })
  }

  pdf(p: PedidoVenta): void {
    this.inv.abrirPdf('pedidosventa', p.id, p.numero)
  }

  // --- Estados ---
  aprobar(p: PedidoVenta): void {
    this.accion(p, this.inv.aprobarPedidoVenta(p.id))
  }

  cerrar(p: PedidoVenta): void {
    if (!confirm(`¿Cerrar ${p.numero} con su saldo pendiente? No se podrá despachar más.`)) return
    this.accion(p, this.inv.cerrarPedidoVenta(p.id))
  }

  anular(p: PedidoVenta): void {
    if (!confirm(`¿Anular ${p.numero}?`)) return
    this.accion(p, this.inv.anularPedidoVenta(p.id))
  }

  private accion(p: PedidoVenta, obs: ReturnType<InventarioService['aprobarPedidoVenta']>): void {
    this.aviso.set(null)
    this.procesando.set(p.id)
    obs.subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo completar la acción.')
      },
    })
  }

  // --- Despachar ---
  abrirDespachar(p: PedidoVenta): void {
    this.errorDespachar.set(null)
    this.pedidoDespacharId = p.id
    this.pedidoDespacharNumero.set(p.numero)
    this.lineasDespachar.set([])
    this.mostrarDespachar.set(true)
    this.inv.getPedidoVenta(p.id).subscribe({
      next: (det) => {
        this.lineasDespachar.set(
          det.lineas
            .filter((l) => l.pendiente > 0)
            .map((l) => ({
              lineaId: l.lineaId,
              producto: l.producto ?? `#${l.productoId}`,
              pendiente: l.pendiente,
              cantidad: l.pendiente,
              incluir: true,
            }))
        )
      },
      error: () => this.errorDespachar.set('No se pudieron cargar las líneas del pedido.'),
    })
  }

  guardarDespachar(): void {
    this.errorDespachar.set(null)
    const pedido = this.pedidos().find((p) => p.id === this.pedidoDespacharId)
    const seleccionadas = this.lineasDespachar().filter((l) => l.incluir && l.cantidad > 0)
    if (!this.pedidoDespacharId || !pedido) return
    if (seleccionadas.length === 0) {
      this.errorDespachar.set('Incluye al menos una línea con cantidad mayor a 0.')
      return
    }
    if (seleccionadas.some((l) => l.cantidad > l.pendiente)) {
      this.errorDespachar.set('No puedes despachar más de la cantidad pendiente.')
      return
    }

    this.despachando.set(true)
    this.inv.getPedidoVenta(this.pedidoDespacharId).subscribe({
      next: (det) => {
        const productoPorLinea = new Map(det.lineas.map((l) => [l.lineaId, l.productoId]))
        this.inv
          .crearRemision({
            cliente: pedido.cliente,
            observaciones: `Contra ${pedido.numero}`,
            pedidoVentaId: this.pedidoDespacharId!,
            lineas: seleccionadas.map((l) => ({
              productoId: productoPorLinea.get(l.lineaId)!,
              cantidad: l.cantidad,
              pedidoVentaLineaId: l.lineaId,
            })),
          })
          .subscribe({
            next: () => {
              this.despachando.set(false)
              this.mostrarDespachar.set(false)
              this.aviso.set(
                'Remisión creada en borrador. Confírmala en Remisiones para descontar el stock.'
              )
              this.cargar()
            },
            error: (e) => {
              this.despachando.set(false)
              this.errorDespachar.set(
                typeof e?.error === 'string' ? e.error : 'No se pudo crear la remisión.'
              )
            },
          })
      },
      error: () => {
        this.despachando.set(false)
        this.errorDespachar.set('No se pudo leer el pedido.')
      },
    })
  }
}
