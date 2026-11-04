import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Categoria,
  type Producto,
} from '../inventario.service'

@Component({
  selector: 'app-inventario-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './productos.html',
})
export class Productos implements OnInit {
  private inv = inject(InventarioService)

  productos = signal<Producto[]>([])
  categorias = signal<Categoria[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  busqueda = signal('')

  // Formulario de creación.
  mostrarForm = signal(false)
  guardando = signal(false)
  nuevo = { nombre: '', descripcion: '', precio: 0, stockInicial: 0, categoriaId: 0 }

  // Métricas.
  total = computed(() => this.productos().length)
  valorInventario = computed(() =>
    this.productos().reduce((s, p) => s + p.precio * p.stock, 0)
  )
  sinStock = computed(() => this.productos().filter((p) => p.stock === 0).length)
  numCategorias = computed(
    () => new Set(this.productos().map((p) => p.categoria)).size
  )

  filtrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim()
    if (!q) return this.productos()
    return this.productos().filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria ?? '').toLowerCase().includes(q)
    )
  })

  ngOnInit(): void {
    this.cargar()
    this.inv.getCategorias().subscribe({
      next: (c) => this.categorias.set(c),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getProductos().subscribe({
      next: (data) => {
        this.productos.set(data)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set(
          'No se pudo conectar con la API. Verifica que el backend .NET esté corriendo en el puerto 5045.'
        )
        this.cargando.set(false)
      },
    })
  }

  abrirForm(): void {
    this.nuevo = {
      nombre: '',
      descripcion: '',
      precio: 0,
      stockInicial: 0,
      categoriaId: this.categorias()[0]?.id ?? 0,
    }
    this.mostrarForm.set(true)
  }

  crear(): void {
    if (!this.nuevo.nombre.trim() || !this.nuevo.categoriaId) return
    this.guardando.set(true)
    this.inv.crearProducto(this.nuevo).subscribe({
      next: () => {
        this.guardando.set(false)
        this.mostrarForm.set(false)
        this.cargar()
      },
      error: () => this.guardando.set(false),
    })
  }

  eliminar(p: Producto): void {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    this.inv.eliminarProducto(p.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    })
  }
}
