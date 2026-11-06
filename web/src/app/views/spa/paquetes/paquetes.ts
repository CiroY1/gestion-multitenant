import { PageTitle } from '@/app/components/page-title'
import { ConfirmService } from '@/app/core/services/confirm.service'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SpaService, type Paquete } from '../spa.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

@Component({
  selector: 'app-spa-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './paquetes.html',
})
export class Paquetes implements OnInit {
  private spa = inject(SpaService)
  private confirm = inject(ConfirmService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }

  paquetes = signal<Paquete[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<number | null>(null)
  form = { nombre: '', sesiones: 10, precio: 0, activo: true }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getPaquetes().subscribe({
      next: (d) => {
        this.paquetes.set(d)
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
    this.form = { nombre: '', sesiones: 10, precio: 0, activo: true }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(p: Paquete): void {
    this.editId.set(p.id)
    this.form = { nombre: p.nombre, sesiones: p.sesiones, precio: p.precio, activo: p.activo }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim() || this.form.sesiones < 1) {
      this.aviso.set('El nombre y un número de sesiones mayor a 0 son obligatorios.')
      return
    }
    this.guardando.set(true)
    const id = this.editId()
    const obs = id
      ? this.spa.actualizarPaquete(id, this.form)
      : this.spa.crearPaquete(this.form)
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
            : 'No se pudo guardar el paquete.'
        )
      },
    })
  }

  async eliminar(p: Paquete): Promise<void> {
    if (!(await this.confirm.ask({ mensaje: `¿Eliminar el paquete "${p.nombre}"?`, titulo: 'Eliminar' }))) return
    this.aviso.set(null)
    this.spa.eliminarPaquete(p.id).subscribe({
      next: () => this.cargar(),
      error: () => this.aviso.set('No se pudo eliminar el paquete.'),
    })
  }
}
