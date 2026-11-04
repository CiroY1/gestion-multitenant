import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Producto,
  type Recepcion,
} from '../inventario.service'

interface LineaForm {
  productoId: number
  cantidad: number
  costoUnitario: number
}

@Component({
  selector: 'app-inventario-recepciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './recepciones.html',
})
export class Recepciones implements OnInit {
  private inv = inject(InventarioService)

  recepciones = signal<Recepcion[]>([])
  productos = signal<Producto[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)

  proveedor = ''
  observaciones = ''
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
    this.lineas = [
      { productoId: this.productos()[0]?.id ?? 0, cantidad: 1, costoUnitario: 0 },
    ]
    this.mostrarForm.set(true)
  }

  agregarLinea(): void {
    this.lineas.push({
      productoId: this.productos()[0]?.id ?? 0,
      cantidad: 1,
      costoUnitario: 0,
    })
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
        lineas: this.lineas,
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
}
