import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import { TercerosService, type Proveedor } from '../terceros.service'

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './proveedores.html',
})
export class Proveedores implements OnInit {
  private svc = inject(TercerosService)

  items = signal<Proveedor[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId: number | null = null
  form = { nombre: '', nit: '', telefono: '', email: '' }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.svc.getProveedores().subscribe({
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
    this.form = { nombre: '', nit: '', telefono: '', email: '' }
    this.mostrarForm.set(true)
  }

  abrirEditar(p: Proveedor): void {
    this.editId = p.id
    this.form = { nombre: p.nombre, nit: p.nit ?? '', telefono: p.telefono ?? '', email: p.email ?? '' }
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim()) return
    this.guardando.set(true)
    this.aviso.set(null)
    const obs: Observable<unknown> = this.editId
      ? this.svc.actualizarProveedor(this.editId, this.form)
      : this.svc.crearProveedor(this.form)
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

  eliminar(p: Proveedor): void {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    this.aviso.set(null)
    this.svc.eliminarProveedor(p.id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo eliminar.'),
    })
  }
}
