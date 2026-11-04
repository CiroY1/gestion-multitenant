import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Producto,
  type Remision,
} from '../inventario.service'

interface LineaForm {
  productoId: number
  cantidad: number
}

@Component({
  selector: 'app-inventario-remisiones',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './remisiones.html',
})
export class Remisiones implements OnInit {
  private inv = inject(InventarioService)

  remisiones = signal<Remision[]>([])
  productos = signal<Producto[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  errorForm = signal<string | null>(null)

  cliente = ''
  observaciones = ''
  lineas: LineaForm[] = []

  ngOnInit(): void {
    this.cargar()
    this.inv.getProductos().subscribe({
      next: (p) => this.productos.set(p),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getRemisiones().subscribe({
      next: (d) => {
        this.remisiones.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  abrirForm(): void {
    this.cliente = ''
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
    if (!this.cliente.trim() || this.lineas.length === 0) return
    this.guardando.set(true)
    this.errorForm.set(null)
    this.inv
      .crearRemision({
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
          this.errorForm.set(
            typeof e?.error === 'string'
              ? e.error
              : 'No se pudo registrar la remisión (¿stock insuficiente?).'
          )
        },
      })
  }
}
