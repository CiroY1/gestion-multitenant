import { PageTitle } from '@/app/components/page-title'
import { ConfirmService } from '@/app/core/services/confirm.service'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SpaService, type ServicioSpa } from '../spa.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

@Component({
  selector: 'app-spa-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './servicios.html',
})
export class Servicios implements OnInit {
  private spa = inject(SpaService)
  private confirm = inject(ConfirmService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }

  servicios = signal<ServicioSpa[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<number | null>(null)
  nuevo = { nombre: '', descripcion: '', duracionMin: 30, precio: 0, activo: true }

  total = computed(() => this.servicios().length)

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getServicios().subscribe({
      next: (d) => {
        this.servicios.set(d)
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
    this.editId.set(null)
    this.nuevo = { nombre: '', descripcion: '', duracionMin: 30, precio: 0, activo: true }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(s: ServicioSpa): void {
    this.editId.set(s.id)
    this.nuevo = {
      nombre: s.nombre,
      descripcion: s.descripcion,
      duracionMin: s.duracionMin,
      precio: s.precio,
      activo: s.activo,
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.nuevo.nombre.trim()) return
    this.guardando.set(true)
    const id = this.editId()
    const obs = id
      ? this.spa.actualizarServicio(id, this.nuevo)
      : this.spa.crearServicio(this.nuevo)
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
            : 'No se pudo guardar el servicio.'
        )
      },
    })
  }

  async eliminar(s: ServicioSpa): Promise<void> {
    if (!(await this.confirm.ask({ mensaje: `¿Eliminar "${s.nombre}"?`, titulo: 'Eliminar' }))) return
    this.aviso.set(null)
    this.spa.eliminarServicio(s.id).subscribe({
      next: () => this.cargar(),
      error: () => this.aviso.set('No se pudo eliminar el servicio.'),
    })
  }
}
