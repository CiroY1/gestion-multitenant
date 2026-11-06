import { PageTitle } from '@/app/components/page-title'
import { ConfirmService } from '@/app/core/services/confirm.service'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Bodega,
  type Producto,
  type Traslado,
} from '../inventario.service'

interface LineaForm {
  productoId: number
  cantidad: number
}

@Component({
  selector: 'app-inventario-traslados',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './traslados.html',
})
export class Traslados implements OnInit {
  private inv = inject(InventarioService)
  private confirm = inject(ConfirmService)

  traslados = signal<Traslado[]>([])
  bodegas = signal<Bodega[]>([])
  productos = signal<Producto[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  procesando = signal<number | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  errorForm = signal<string | null>(null)
  bodegaOrigenId: number | null = null
  bodegaDestinoId: number | null = null
  observaciones = ''
  lineas: LineaForm[] = []

  ngOnInit(): void {
    this.cargar()
    this.inv.getBodegas().subscribe({
      next: (b) => this.bodegas.set(b.filter((x) => x.activa)),
      error: () => {},
    })
    this.inv.getProductos().subscribe({
      next: (p) => this.productos.set(p),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getTraslados().subscribe({
      next: (d) => {
        this.traslados.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  abrirForm(): void {
    this.bodegaOrigenId = this.bodegas()[0]?.id ?? null
    this.bodegaDestinoId = this.bodegas()[1]?.id ?? null
    this.observaciones = ''
    this.errorForm.set(null)
    this.lineas = [{ productoId: this.productos()[0]?.id ?? 0, cantidad: 1 }]
    this.mostrarForm.set(true)
  }

  agregarLinea(): void {
    this.lineas.push({ productoId: this.productos()[0]?.id ?? 0, cantidad: 1 })
  }

  quitarLinea(i: number): void {
    this.lineas.splice(i, 1)
  }

  guardar(): void {
    this.errorForm.set(null)
    if (!this.bodegaOrigenId || !this.bodegaDestinoId) {
      this.errorForm.set('Elige bodega origen y destino.')
      return
    }
    if (this.bodegaOrigenId === this.bodegaDestinoId) {
      this.errorForm.set('La bodega origen y destino deben ser distintas.')
      return
    }
    if (this.lineas.length === 0) return
    this.guardando.set(true)
    this.inv
      .crearTraslado({
        bodegaOrigenId: this.bodegaOrigenId,
        bodegaDestinoId: this.bodegaDestinoId,
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
          this.errorForm.set(typeof e?.error === 'string' ? e.error : 'No se pudo crear el traslado.')
        },
      })
  }

  confirmar(t: Traslado): void {
    this.accion(t, this.inv.confirmarTraslado(t.id))
  }

  async anular(t: Traslado): Promise<void> {
    if (!(await this.confirm.ask({ mensaje: `¿Anular ${t.numero}? Si estaba confirmado, se revierte el movimiento.`, titulo: 'Anular' }))) return
    this.accion(t, this.inv.anularTraslado(t.id))
  }

  private accion(t: Traslado, obs: ReturnType<InventarioService['confirmarTraslado']>): void {
    this.aviso.set(null)
    this.procesando.set(t.id)
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
}
