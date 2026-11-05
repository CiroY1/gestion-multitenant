import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Ajuste,
  type Bodega,
  type Producto,
} from '../inventario.service'

interface LineaForm {
  productoId: number
  tipo: 'Entrada' | 'Salida'
  cantidad: number
}

@Component({
  selector: 'app-inventario-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './ajustes.html',
})
export class Ajustes implements OnInit {
  private inv = inject(InventarioService)

  ajustes = signal<Ajuste[]>([])
  productos = signal<Producto[]>([])
  bodegas = signal<Bodega[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  procesando = signal<number | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  errorForm = signal<string | null>(null)
  motivo = ''
  bodegaId: number | null = null
  lineas: LineaForm[] = []

  ngOnInit(): void {
    this.cargar()
    this.inv.getProductos().subscribe({
      next: (p) => this.productos.set(p),
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
    this.inv.getAjustes().subscribe({
      next: (d) => {
        this.ajustes.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  stockDe(productoId: number): number {
    return this.productos().find((p) => p.id === productoId)?.stock ?? 0
  }

  abrirForm(): void {
    this.motivo = ''
    this.bodegaId = this.bodegas()[0]?.id ?? null
    this.errorForm.set(null)
    this.lineas = [{ productoId: this.productos()[0]?.id ?? 0, tipo: 'Entrada', cantidad: 1 }]
    this.mostrarForm.set(true)
  }

  agregarLinea(): void {
    this.lineas.push({ productoId: this.productos()[0]?.id ?? 0, tipo: 'Entrada', cantidad: 1 })
  }

  quitarLinea(i: number): void {
    this.lineas.splice(i, 1)
  }

  guardar(): void {
    if (!this.motivo.trim() || this.lineas.length === 0) return
    this.guardando.set(true)
    this.errorForm.set(null)
    this.inv
      .crearAjuste({ motivo: this.motivo, bodegaId: this.bodegaId ?? undefined, lineas: this.lineas })
      .subscribe({
        next: () => {
          this.guardando.set(false)
          this.mostrarForm.set(false)
          this.cargar()
        },
        error: (e) => {
          this.guardando.set(false)
          this.errorForm.set(typeof e?.error === 'string' ? e.error : 'No se pudo crear el ajuste.')
        },
      })
  }

  pdf(a: Ajuste): void {
    this.inv.abrirPdf('ajustes', a.id, a.numero)
  }

  confirmar(a: Ajuste): void {
    this.aviso.set(null)
    this.procesando.set(a.id)
    this.inv.confirmarAjuste(a.id).subscribe({
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

  anular(a: Ajuste): void {
    if (!confirm(`¿Anular ${a.numero}? Si estaba confirmado, se revertirá el stock.`)) return
    this.aviso.set(null)
    this.procesando.set(a.id)
    this.inv.anularAjuste(a.id).subscribe({
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
