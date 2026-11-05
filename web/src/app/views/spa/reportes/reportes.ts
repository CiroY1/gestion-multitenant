import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { SpaService, type ReporteResumen } from '../spa.service'

@Component({
  selector: 'app-spa-reportes',
  standalone: true,
  imports: [CommonModule, PageTitle],
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {
  private spa = inject(SpaService)

  data = signal<ReporteResumen | null>(null)
  cargando = signal(true)
  error = signal<string | null>(null)

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getReporteResumen().subscribe({
      next: (d) => {
        this.data.set(d)
        this.cargando.set(false)
      },
      error: (e) => {
        this.error.set(
          e?.status === 403
            ? 'Tu empresa no tiene activo el módulo spa.'
            : 'No se pudo cargar el reporte (segundo backend, puerto 5046).'
        )
        this.cargando.set(false)
      },
    })
  }

  /** Porcentaje de una barra respecto al máximo de la lista. */
  pct(valor: number, lista: { citas: number }[]): number {
    const max = Math.max(1, ...lista.map((x) => x.citas))
    return Math.round((valor / max) * 100)
  }
}
