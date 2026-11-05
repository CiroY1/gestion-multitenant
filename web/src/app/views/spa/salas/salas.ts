import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SpaService, type Sala } from '../spa.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

@Component({
  selector: 'app-spa-salas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './salas.html',
})
export class Salas implements OnInit {
  private spa = inject(SpaService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }

  salas = signal<Sala[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<number | null>(null)
  form = { nombre: '', activa: true }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getSalas().subscribe({
      next: (d) => {
        this.salas.set(d)
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
    this.form = { nombre: '', activa: true }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(s: Sala): void {
    this.editId.set(s.id)
    this.form = { nombre: s.nombre, activa: s.activa }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim()) return
    this.guardando.set(true)
    const id = this.editId()
    const obs = id
      ? this.spa.actualizarSala(id, this.form)
      : this.spa.crearSala(this.form)
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
            : 'No se pudo guardar la sala.'
        )
      },
    })
  }

  eliminar(s: Sala): void {
    if (!confirm(`¿Eliminar la sala "${s.nombre}"?`)) return
    this.aviso.set(null)
    this.spa.eliminarSala(s.id).subscribe({
      next: () => this.cargar(),
      error: () => this.aviso.set('No se pudo eliminar la sala.'),
    })
  }
}
