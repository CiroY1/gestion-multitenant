import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Bodega,
  type Producto,
  type Receta,
} from '../inventario.service'

interface IngForm {
  productoId: number
  cantidad: number
}

@Component({
  selector: 'app-inventario-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './recetas.html',
})
export class Recetas implements OnInit {
  private inv = inject(InventarioService)

  recetas = signal<Receta[]>([])
  productos = signal<Producto[]>([])
  bodegas = signal<Bodega[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  exito = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)

  // Producción
  produciendo = signal<Receta | null>(null)
  producirCantidad = 1
  producirBodegaId: number | null = null
  procesandoProd = signal(false)

  nombre = ''
  productoFinalId = 0
  ingredientes: IngForm[] = []

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
    this.inv.getRecetas().subscribe({
      next: (d) => {
        this.recetas.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  abrirForm(): void {
    this.nombre = ''
    this.productoFinalId = this.productos()[0]?.id ?? 0
    this.ingredientes = [{ productoId: this.productos()[0]?.id ?? 0, cantidad: 1 }]
    this.mostrarForm.set(true)
  }

  agregarIng(): void {
    this.ingredientes.push({ productoId: this.productos()[0]?.id ?? 0, cantidad: 1 })
  }

  quitarIng(i: number): void {
    this.ingredientes.splice(i, 1)
  }

  guardar(): void {
    if (!this.nombre.trim() || !this.productoFinalId || this.ingredientes.length === 0) return
    this.guardando.set(true)
    this.aviso.set(null)
    this.inv
      .crearReceta({
        nombre: this.nombre,
        productoFinalId: this.productoFinalId,
        ingredientes: this.ingredientes,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false)
          this.mostrarForm.set(false)
          this.cargar()
        },
        error: (e) => {
          this.guardando.set(false)
          this.aviso.set(
            typeof e?.error === 'string' ? e.error : 'No se pudo crear la receta.'
          )
        },
      })
  }

  abrirProducir(r: Receta): void {
    this.produciendo.set(r)
    this.producirCantidad = 1
    this.producirBodegaId = this.bodegas()[0]?.id ?? null
    this.aviso.set(null)
    this.exito.set(null)
  }

  confirmarProducir(): void {
    const r = this.produciendo()
    if (!r || this.producirCantidad <= 0) return
    this.procesandoProd.set(true)
    this.aviso.set(null)
    this.exito.set(null)
    this.inv.producir(r.id, this.producirCantidad, this.producirBodegaId ?? undefined).subscribe({
      next: () => {
        this.procesandoProd.set(false)
        this.exito.set(
          `Se produjeron ${this.producirCantidad} unidad(es) de "${r.productoFinal}". Revisa el stock en Productos.`
        )
        this.produciendo.set(null)
      },
      error: (e) => {
        this.procesandoProd.set(false)
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo producir.')
      },
    })
  }
}
