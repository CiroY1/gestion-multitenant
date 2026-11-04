import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import { TercerosService, type Cliente } from '../terceros.service'

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './clientes.html',
})
export class Clientes implements OnInit {
  private svc = inject(TercerosService)

  items = signal<Cliente[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId: number | null = null
  form = { nombre: '', documento: '', telefono: '', email: '' }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.svc.getClientes().subscribe({
      next: (d) => {
        this.items.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  abrirCrear(): void {
    this.editId = null
    this.form = { nombre: '', documento: '', telefono: '', email: '' }
    this.mostrarForm.set(true)
  }

  abrirEditar(c: Cliente): void {
    this.editId = c.id
    this.form = { nombre: c.nombre, documento: c.documento ?? '', telefono: c.telefono ?? '', email: c.email ?? '' }
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim()) return
    this.guardando.set(true)
    this.aviso.set(null)
    const obs: Observable<unknown> = this.editId
      ? this.svc.actualizarCliente(this.editId, this.form)
      : this.svc.crearCliente(this.form)
    obs.subscribe({
      next: () => {
        this.guardando.set(false)
        this.mostrarForm.set(false)
        this.cargar()
      },
      error: (e) => {
        this.guardando.set(false)
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo guardar.')
      },
    })
  }

  eliminar(c: Cliente): void {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return
    this.aviso.set(null)
    this.svc.eliminarCliente(c.id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo eliminar.'),
    })
  }
}
