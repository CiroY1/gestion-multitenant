import { PageTitle } from '@/app/components/page-title'
import { ConfirmService } from '@/app/core/services/confirm.service'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type OrdenCompra,
  type Producto,
} from '../inventario.service'
import { TercerosService, type Proveedor } from '../../terceros/terceros.service'

interface LineaForm {
  productoId: number
  cantidad: number
  costoUnitario: number
}

interface LineaRecibir {
  lineaId: number
  producto: string
  pendiente: number
  cantidad: number
  incluir: boolean
}

@Component({
  selector: 'app-inventario-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './ordenes.html',
})
export class OrdenesCompra implements OnInit {
  private inv = inject(InventarioService)
  private confirm = inject(ConfirmService)
  private terceros = inject(TercerosService)

  ordenes = signal<OrdenCompra[]>([])
  productos = signal<Producto[]>([])
  proveedores = signal<Proveedor[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  procesando = signal<number | null>(null)

  // Crear orden
  mostrarForm = signal(false)
  guardando = signal(false)
  errorForm = signal<string | null>(null)
  proveedor = ''
  observaciones = ''
  lineas: LineaForm[] = []

  get total(): number {
    return this.lineas.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0)
  }

  // Recibir contra orden
  mostrarRecibir = signal(false)
  recibiendo = signal(false)
  errorRecibir = signal<string | null>(null)
  ordenRecibirNumero = signal('')
  private ordenRecibirId: number | null = null
  lineasRecibir = signal<LineaRecibir[]>([])

  ngOnInit(): void {
    this.cargar()
    this.inv.getProductos().subscribe({
      next: (p) => this.productos.set(p),
      error: () => {},
    })
    this.terceros.getProveedores().subscribe({
      next: (p) => this.proveedores.set(p),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getOrdenesCompra().subscribe({
      next: (d) => {
        this.ordenes.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  // --- Crear ---
  abrirForm(): void {
    this.proveedor = ''
    this.observaciones = ''
    this.errorForm.set(null)
    this.lineas = [{ productoId: this.productos()[0]?.id ?? 0, cantidad: 1, costoUnitario: 0 }]
    this.mostrarForm.set(true)
  }

  agregarLinea(): void {
    this.lineas.push({ productoId: this.productos()[0]?.id ?? 0, cantidad: 1, costoUnitario: 0 })
  }

  quitarLinea(i: number): void {
    this.lineas.splice(i, 1)
  }

  guardar(): void {
    if (!this.proveedor.trim() || this.lineas.length === 0) return
    this.guardando.set(true)
    this.errorForm.set(null)
    this.inv
      .crearOrdenCompra({
        proveedor: this.proveedor,
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
          this.errorForm.set(typeof e?.error === 'string' ? e.error : 'No se pudo crear la orden.')
        },
      })
  }

  pdf(o: OrdenCompra): void {
    this.inv.abrirPdf('ordenescompra', o.id, o.numero)
  }

  // --- Estados ---
  aprobar(o: OrdenCompra): void {
    this.accion(o, this.inv.aprobarOrdenCompra(o.id))
  }

  async cerrar(o: OrdenCompra): Promise<void> {
    if (!(await this.confirm.ask({ mensaje: `¿Cerrar ${o.numero} con su saldo pendiente? No se podrá recibir más.`, titulo: 'Cerrar' }))) return
    this.accion(o, this.inv.cerrarOrdenCompra(o.id))
  }

  async anular(o: OrdenCompra): Promise<void> {
    if (!(await this.confirm.ask({ mensaje: `¿Anular ${o.numero}?`, titulo: 'Anular' }))) return
    this.accion(o, this.inv.anularOrdenCompra(o.id))
  }

  private accion(o: OrdenCompra, obs: ReturnType<InventarioService['aprobarOrdenCompra']>): void {
    this.aviso.set(null)
    this.procesando.set(o.id)
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

  // --- Recibir ---
  abrirRecibir(o: OrdenCompra): void {
    this.errorRecibir.set(null)
    this.ordenRecibirId = o.id
    this.ordenRecibirNumero.set(o.numero)
    this.lineasRecibir.set([])
    this.mostrarRecibir.set(true)
    this.inv.getOrdenCompra(o.id).subscribe({
      next: (det) => {
        this.lineasRecibir.set(
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
      error: () => this.errorRecibir.set('No se pudieron cargar las líneas de la orden.'),
    })
  }

  guardarRecibir(): void {
    this.errorRecibir.set(null)
    const orden = this.ordenes().find((o) => o.id === this.ordenRecibirId)
    const seleccionadas = this.lineasRecibir().filter((l) => l.incluir && l.cantidad > 0)
    if (!this.ordenRecibirId || !orden) return
    if (seleccionadas.length === 0) {
      this.errorRecibir.set('Incluye al menos una línea con cantidad mayor a 0.')
      return
    }
    if (seleccionadas.some((l) => l.cantidad > l.pendiente)) {
      this.errorRecibir.set('No puedes recibir más de la cantidad pendiente.')
      return
    }

    // Reconstruye el costo desde la orden para cada línea.
    this.recibiendo.set(true)
    this.inv.getOrdenCompra(this.ordenRecibirId).subscribe({
      next: (det) => {
        const costoPorLinea = new Map(det.lineas.map((l) => [l.lineaId, l.costoUnitario]))
        const productoPorLinea = new Map(det.lineas.map((l) => [l.lineaId, l.productoId]))
        this.inv
          .crearRecepcion({
            proveedor: orden.proveedor,
            observaciones: `Contra ${orden.numero}`,
            ordenCompraId: this.ordenRecibirId!,
            lineas: seleccionadas.map((l) => ({
              productoId: productoPorLinea.get(l.lineaId)!,
              cantidad: l.cantidad,
              costoUnitario: costoPorLinea.get(l.lineaId) ?? 0,
              ordenCompraLineaId: l.lineaId,
            })),
          })
          .subscribe({
            next: () => {
              this.recibiendo.set(false)
              this.mostrarRecibir.set(false)
              this.aviso.set(
                'Recepción creada en borrador. Confírmala en Recepciones para sumar el stock.'
              )
              this.cargar()
            },
            error: (e) => {
              this.recibiendo.set(false)
              this.errorRecibir.set(
                typeof e?.error === 'string' ? e.error : 'No se pudo crear la recepción.'
              )
            },
          })
      },
      error: () => {
        this.recibiendo.set(false)
        this.errorRecibir.set('No se pudo leer la orden.')
      },
    })
  }
}
