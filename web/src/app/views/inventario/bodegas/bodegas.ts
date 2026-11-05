import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { InventarioService, type Bodega } from '../inventario.service'

@Component({
  selector: 'app-inventario-bodegas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './bodegas.html',
})
export class Bodegas implements OnInit {
  private inv = inject(InventarioService)

  bodegas = signal<Bodega[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId: number | null = null
  form = { nombre: '', codigo: '', activa: true }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getBodegas().subscribe({
      next: (d) => {
        this.bodegas.set(d)
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
    this.form = { nombre: '', codigo: '', activa: true }
    this.mostrarForm.set(true)
  }

  abrirEditar(b: Bodega): void {
    this.editId = b.id
    this.form = { nombre: b.nombre, codigo: b.codigo ?? '', activa: b.activa }
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim()) return
    this.guardando.set(true)
    this.aviso.set(null)
    const dto = { nombre: this.form.nombre, codigo: this.form.codigo, activa: this.form.activa }
    const obs = this.editId
      ? this.inv.actualizarBodega(this.editId, dto)
      : this.inv.crearBodega(dto)
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
}
