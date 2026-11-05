import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { InventarioService, type Lote } from '../inventario.service'

interface EstadoLote {
  label: string
  cls: string
  orden: number
}

@Component({
  selector: 'app-inventario-vencimientos',
  standalone: true,
  imports: [CommonModule, PageTitle],
  templateUrl: './vencimientos.html',
})
export class Vencimientos implements OnInit {
  private inv = inject(InventarioService)

  lotes = signal<Lote[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)

  /** Lotes con stock que están vencidos o por vencer (para la alerta). */
  alertas = computed(
    () =>
      this.lotes().filter((l) => l.stock > 0 && this.estado(l).orden <= 1).length
  )

  // Resumen (solo lotes con existencia).
  vencidos = computed(() => this.lotes().filter((l) => l.stock > 0 && this.estado(l).orden === 0).length)
  porVencer = computed(() => this.lotes().filter((l) => l.stock > 0 && this.estado(l).orden === 1).length)
  vigentes = computed(() => this.lotes().filter((l) => l.stock > 0 && this.estado(l).orden >= 2).length)

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getLotes().subscribe({
      next: (d) => {
        this.lotes.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  estado(l: Lote): EstadoLote {
    if (!l.fechaVencimiento)
      return { label: 'Sin fecha', cls: 'bg-light text-dark', orden: 3 }
    const dias = Math.ceil(
      (new Date(l.fechaVencimiento).getTime() - Date.now()) / 86_400_000
    )
    if (dias < 0) return { label: 'Vencido', cls: 'bg-danger-subtle text-danger', orden: 0 }
    if (dias <= 30)
      return { label: `Por vencer (${dias}d)`, cls: 'bg-warning-subtle text-warning', orden: 1 }
    return { label: 'Vigente', cls: 'bg-success-subtle text-success', orden: 2 }
  }
}
