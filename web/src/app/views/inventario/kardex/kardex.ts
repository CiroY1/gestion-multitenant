import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import {
  InventarioService,
  type Kardex,
  type Producto,
} from '../inventario.service'

@Component({
  selector: 'app-inventario-kardex',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './kardex.html',
})
export class KardexView implements OnInit {
  private inv = inject(InventarioService)
  private route = inject(ActivatedRoute)

  productos = signal<Producto[]>([])
  productoId: number | null = null
  kardex = signal<Kardex | null>(null)
  cargando = signal(false)
  error = signal<string | null>(null)

  ngOnInit(): void {
    this.inv.getProductos().subscribe({
      next: (p) => {
        this.productos.set(p)
        const q = Number(this.route.snapshot.queryParamMap.get('producto'))
        if (q) {
          this.productoId = q
          this.cargar()
        }
      },
      error: () => this.error.set('No se pudo conectar con la API (puerto 5045).'),
    })
  }

  cargar(): void {
    if (!this.productoId) {
      this.kardex.set(null)
      return
    }
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getKardex(this.productoId).subscribe({
      next: (k) => {
        this.kardex.set(k)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo cargar el kardex.')
        this.cargando.set(false)
      },
    })
  }
}
