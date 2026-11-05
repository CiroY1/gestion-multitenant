import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SpaService, type Tarea, type Trabajador } from '../spa.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

@Component({
  selector: 'app-spa-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './tareas.html',
})
export class Tareas implements OnInit {
  private spa = inject(SpaService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }
  private get miEmail(): string {
    return (this.auth.usuario?.email ?? '').toLowerCase()
  }

  tareas = signal<Tarea[]>([])
  trabajadores = signal<Trabajador[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  filtroTrabajador = 0 // 0 = todos
  procesando = signal<number | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  form = { titulo: '', trabajadorId: 0, fechaHora: '', notas: '' }

  pendientes = computed(
    () => this.tareas().filter((t) => t.estado !== 'Hecha').length
  )

  /** Trabajadores activos (para asignar en el formulario). */
  activos = computed(() => this.trabajadores().filter((t) => t.activo))

  ngOnInit(): void {
    this.spa.getTrabajadores().subscribe({
      next: (d) => this.trabajadores.set(d),
      error: () => {},
    })
    this.cargar()
  }

  /** Solo el admin o el trabajador asignado (vinculado por email) puede cambiar la tarea. */
  puedeCambiar(t: Tarea): boolean {
    if (this.esAdmin) return true
    const w = this.trabajadores().find((x) => x.id === t.trabajadorId)
    return !!w?.email && w.email.toLowerCase() === this.miEmail
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getTareas(this.filtroTrabajador || undefined).subscribe({
      next: (d) => {
        this.tareas.set(d)
        this.cargando.set(false)
      },
      error: (e) => {
        this.error.set(
          e?.status === 403
            ? 'Tu empresa no tiene activo el módulo spa.'
            : 'No se pudo conectar con el segundo backend (puerto 5046).'
        )
        this.cargando.set(false)
      },
    })
  }

  abrirForm(): void {
    this.form = {
      titulo: '',
      trabajadorId: this.activos()[0]?.id ?? 0,
      fechaHora: '',
      notas: '',
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  crear(): void {
    if (!this.form.titulo.trim() || !this.form.trabajadorId || !this.form.fechaHora) {
      this.aviso.set('Título, trabajador y fecha/hora son obligatorios.')
      return
    }
    this.guardando.set(true)
    this.spa.crearTarea(this.form).subscribe({
      next: () => {
        this.guardando.set(false)
        this.mostrarForm.set(false)
        this.cargar()
      },
      error: (e) => {
        this.guardando.set(false)
        this.aviso.set(
          typeof e?.error?.message === 'string'
            ? e.error.message
            : 'No se pudo crear la tarea.'
        )
      },
    })
  }

  iniciar(t: Tarea): void {
    this.procesando.set(t.id)
    this.spa.iniciarTarea(t.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(
          typeof e?.error?.message === 'string' ? e.error.message : 'No se pudo iniciar.'
        )
      },
    })
  }

  completar(t: Tarea): void {
    this.procesando.set(t.id)
    this.spa.completarTarea(t.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(
          typeof e?.error?.message === 'string' ? e.error.message : 'No se pudo completar.'
        )
      },
    })
  }

  badge(e: Tarea['estado']): string {
    if (e === 'Hecha') return 'bg-success-subtle text-success'
    if (e === 'EnProgreso') return 'bg-info-subtle text-info'
    return 'bg-warning-subtle text-warning'
  }

  estadoLabel(e: Tarea['estado']): string {
    return e === 'EnProgreso' ? 'En progreso' : e
  }
}
