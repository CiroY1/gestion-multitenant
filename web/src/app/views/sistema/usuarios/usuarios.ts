import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  UsuariosService,
  type RolUsuario,
  type Usuario,
} from '../usuarios.service'

@Component({
  selector: 'app-sistema-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private svc = inject(UsuariosService)

  usuarios = signal<Usuario[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<number | null>(null)
  form = {
    email: '',
    password: '',
    rol: 'operador' as RolUsuario,
    activo: true,
  }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.svc.getUsuarios().subscribe({
      next: (d) => {
        this.usuarios.set(d)
        this.cargando.set(false)
      },
      error: (e) => {
        this.error.set(
          e?.status === 403
            ? 'Solo un administrador puede gestionar usuarios.'
            : 'No se pudo conectar con la API (puerto 5045).'
        )
        this.cargando.set(false)
      },
    })
  }

  abrirCrear(): void {
    this.editId.set(null)
    this.form = { email: '', password: '', rol: 'operador', activo: true }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(u: Usuario): void {
    this.editId.set(u.id)
    this.form = { email: u.email, password: '', rol: u.rol, activo: u.activo }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  guardar(): void {
    const id = this.editId()
    if (!id) {
      // Crear
      if (!this.form.email.trim() || this.form.password.length < 6) {
        this.aviso.set('Email válido y contraseña de al menos 6 caracteres.')
        return
      }
      this.guardando.set(true)
      this.svc
        .crear({ email: this.form.email, password: this.form.password, rol: this.form.rol })
        .subscribe({
          next: () => this.finOk(),
          error: (e) => this.finError(e),
        })
      return
    }

    // Editar: rol + activo y, opcionalmente, nueva contraseña.
    this.guardando.set(true)
    this.svc.actualizar(id, { rol: this.form.rol, activo: this.form.activo }).subscribe({
      next: () => {
        const nueva = this.form.password.trim()
        if (nueva) {
          if (nueva.length < 6) {
            this.guardando.set(false)
            this.aviso.set('La nueva contraseña debe tener al menos 6 caracteres.')
            return
          }
          this.svc.resetPassword(id, nueva).subscribe({
            next: () => this.finOk(),
            error: (e) => this.finError(e),
          })
        } else {
          this.finOk()
        }
      },
      error: (e) => this.finError(e),
    })
  }

  eliminar(u: Usuario): void {
    if (!confirm(`¿Eliminar al usuario "${u.email}"?`)) return
    this.aviso.set(null)
    this.svc.eliminar(u.id).subscribe({
      next: () => this.cargar(),
      error: (e) =>
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo eliminar.'),
    })
  }

  private finOk(): void {
    this.guardando.set(false)
    this.mostrarForm.set(false)
    this.cargar()
  }

  private finError(e: unknown): void {
    this.guardando.set(false)
    const err = e as { error?: unknown }
    this.aviso.set(typeof err?.error === 'string' ? err.error : 'No se pudo guardar.')
  }
}
