import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { InventarioService, type UnidadMedida } from '../inventario.service'

@Component({
  selector: 'app-inventario-unidades',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './unidades.html',
})
export class Unidades implements OnInit {
  private inv = inject(InventarioService)

  unidades = signal<UnidadMedida[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  form = { nombre: '', abreviatura: '' }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getUnidades().subscribe({
      next: (d) => {
        this.unidades.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  abrirCrear(): void {
    this.form = { nombre: '', abreviatura: '' }
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.abreviatura.trim()) return
    this.guardando.set(true)
    this.aviso.set(null)
    this.inv.crearUnidad(this.form).subscribe({
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
