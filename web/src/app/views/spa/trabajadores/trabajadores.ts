import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SpaService, type Trabajador } from '../spa.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

@Component({
  selector: 'app-spa-trabajadores',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './trabajadores.html',
})
export class Trabajadores implements OnInit {
  private spa = inject(SpaService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }

  trabajadores = signal<Trabajador[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<number | null>(null)
  form = { nombre: '', rol: '', email: '', activo: true }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getTrabajadores().subscribe({
      next: (d) => {
        this.trabajadores.set(d)
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

  abrirCrear(): void {
    this.editId.set(null)
    this.form = { nombre: '', rol: '', email: '', activo: true }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(t: Trabajador): void {
    this.editId.set(t.id)
    this.form = { nombre: t.nombre, rol: t.rol, email: t.email, activo: t.activo }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim()) return
    this.guardando.set(true)
    const id = this.editId()
    const obs = id
      ? this.spa.actualizarTrabajador(id, this.form)
      : this.spa.crearTrabajador(this.form)
    obs.subscribe({
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
            : 'No se pudo guardar el trabajador.'
        )
      },
    })
  }

  eliminar(t: Trabajador): void {
    if (!confirm(`¿Eliminar a "${t.nombre}"?`)) return
    this.aviso.set(null)
    this.spa.eliminarTrabajador(t.id).subscribe({
      next: () => this.cargar(),
      error: () => this.aviso.set('No se pudo eliminar (puede tener tareas asignadas).'),
    })
  }
}
