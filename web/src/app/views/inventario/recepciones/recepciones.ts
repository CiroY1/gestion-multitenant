import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Bodega,
  type Producto,
  type Recepcion,
} from '../inventario.service'
import { TercerosService, type Proveedor } from '../../terceros/terceros.service'

interface LineaForm {
  productoId: number
  cantidad: number
  costoUnitario: number
  loteCodigo?: string
  loteVencimiento?: string
}

@Component({
  selector: 'app-inventario-recepciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './recepciones.html',
})
export class Recepciones implements OnInit {
  private inv = inject(InventarioService)
  private terceros = inject(TercerosService)

  recepciones = signal<Recepcion[]>([])
  productos = signal<Producto[]>([])
  proveedores = signal<Proveedor[]>([])
  bodegas = signal<Bodega[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  procesando = signal<number | null>(null)

  proveedor = ''
  observaciones = ''
  bodegaId: number | null = null
  lineas: LineaForm[] = []

  get total(): number {
    return this.lineas.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0)
  }

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
    this.inv.getBodegas().subscribe({
      next: (b) => this.bodegas.set(b.filter((x) => x.activa)),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getRecepciones().subscribe({
      next: (d) => {
        this.recepciones.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  abrirForm(): void {
    this.proveedor = ''
    this.observaciones = ''
    this.bodegaId = this.bodegas()[0]?.id ?? null
    this.lineas = [
      { productoId: this.productos()[0]?.id ?? 0, cantidad: 1, costoUnitario: 0, loteCodigo: '', loteVencimiento: '' },
    ]
    this.mostrarForm.set(true)
  }

  agregarLinea(): void {
    this.lineas.push({
      productoId: this.productos()[0]?.id ?? 0,
      cantidad: 1,
      costoUnitario: 0,
      loteCodigo: '',
      loteVencimiento: '',
    })
  }

  /** ¿El producto de esta línea rastrea lotes? (para mostrar los campos de lote). */
  rastrea(productoId: number): boolean {
    return this.productos().find((p) => p.id === productoId)?.rastreaLotes ?? false
  }

  quitarLinea(i: number): void {
    this.lineas.splice(i, 1)
  }

  guardar(): void {
    if (!this.proveedor.trim() || this.lineas.length === 0) return
    this.guardando.set(true)
    this.inv
      .crearRecepcion({
        proveedor: this.proveedor,
        observaciones: this.observaciones,
        bodegaId: this.bodegaId ?? undefined,
        lineas: this.lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
          loteCodigo: l.loteCodigo?.trim() || undefined,
          loteVencimiento: l.loteVencimiento || undefined,
        })),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false)
          this.mostrarForm.set(false)
          this.cargar()
        },
        error: () => this.guardando.set(false),
      })
  }

  pdf(r: Recepcion): void {
    this.inv.abrirPdf('recepciones', r.id, r.numero)
  }

  confirmar(r: Recepcion): void {
    this.aviso.set(null)
    this.procesando.set(r.id)
    this.inv.confirmarRecepcion(r.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo confirmar.')
      },
    })
  }

  anular(r: Recepcion): void {
    if (!confirm(`¿Anular ${r.numero}? Si estaba confirmada, se revertirá el stock.`)) return
    this.aviso.set(null)
    this.procesando.set(r.id)
    this.inv.anularRecepcion(r.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo anular.')
      },
    })
  }
}
