import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { InventarioService, type Producto } from '../inventario.service'

@Component({
  selector: 'app-inventario-productos',
  standalone: true,
  imports: [CommonModule, PageTitle],
  templateUrl: './productos.html',
})
export class Productos implements OnInit {
  private inv = inject(InventarioService)

  productos = signal<Producto[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)

  ngOnInit(): void {
    this.cargar()
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
}
