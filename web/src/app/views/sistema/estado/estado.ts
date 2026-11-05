import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import {
  SistemaService,
  type NestDbCheck,
  type NestIdentidad,
} from '../sistema.service'

type EstadoServicio = 'verificando' | 'online' | 'caido'

@Component({
  selector: 'app-sistema-estado',
  standalone: true,
  imports: [CommonModule, PageTitle],
  templateUrl: './estado.html',
})
export class Estado implements OnInit {
  private sis = inject(SistemaService)

  net = signal<EstadoServicio>('verificando')
  nest = signal<EstadoServicio>('verificando')
  identidad = signal<NestIdentidad['usuario'] | null>(null)
  dbCheck = signal<NestDbCheck | null>(null)

  verificando = computed(
    () => this.net() === 'verificando' || this.nest() === 'verificando'
  )

  ngOnInit(): void {
    this.verificar()
  }

  verificar(): void {
    this.net.set('verificando')
    this.nest.set('verificando')
    this.identidad.set(null)
    this.dbCheck.set(null)

    this.sis.netHealth().subscribe({
      next: (r) => this.net.set(r.status === 'ok' ? 'online' : 'caido'),
      error: () => this.net.set('caido'),
    })

    this.sis.nestHealth().subscribe({
      next: () => this.nest.set('online'),
      error: () => this.nest.set('caido'),
    })

    // Estos dos prueban, respectivamente, el JWT compartido y la base compartida.
    this.sis.nestMe().subscribe({
      next: (r) => this.identidad.set(r.usuario),
      error: () => {},
    })

    this.sis.nestDbCheck().subscribe({
      next: (r) => this.dbCheck.set(r),
      error: () => {},
    })
  }
}
