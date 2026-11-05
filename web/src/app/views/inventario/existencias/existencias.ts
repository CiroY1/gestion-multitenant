import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  InventarioService,
  type Bodega,
  type Existencia,
} from '../inventario.service'

@Component({
  selector: 'app-inventario-existencias',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './existencias.html',
})
export class Existencias implements OnInit {
  private inv = inject(InventarioService)

  existencias = signal<Existencia[]>([])
  bodegas = signal<Bodega[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  bodegaId: number | null = null

  ngOnInit(): void {
    this.inv.getBodegas().subscribe({
      next: (b) => this.bodegas.set(b),
      error: () => {},
    })
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getExistencias(this.bodegaId ?? undefined).subscribe({
      next: (d) => {
        this.existencias.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }
}
