import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
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
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  exito = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)

  nombre = ''
  productoFinalId = 0
  ingredientes: IngForm[] = []

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

  producir(r: Receta): void {
    const txt = prompt(`¿Cuántas unidades de "${r.productoFinal}" quieres producir?`, '1')
    if (!txt) return
    const cantidad = parseInt(txt, 10)
    if (!cantidad || cantidad <= 0) return

    this.aviso.set(null)
    this.exito.set(null)
    this.inv.producir(r.id, cantidad).subscribe({
      next: () =>
        this.exito.set(
          `Se produjeron ${cantidad} unidad(es) de "${r.productoFinal}". Revisa el stock en Productos.`
        ),
      error: (e) =>
        this.aviso.set(
          typeof e?.error === 'string' ? e.error : 'No se pudo producir.'
        ),
    })
  }
}
