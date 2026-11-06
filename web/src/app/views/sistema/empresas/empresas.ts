import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EmpresasService, type Empresa } from '../empresas.service'

@Component({
  selector: 'app-sistema-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './empresas.html',
})
export class Empresas implements OnInit {
  private svc = inject(EmpresasService)

  empresas = signal<Empresa[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<string | null>(null)
  form = { id: '', nombre: '', moduloInventario: true, moduloSpa: false }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.svc.getEmpresas().subscribe({
      next: (d) => {
        this.empresas.set(d)
        this.cargando.set(false)
      },
      error: (e) => {
        this.error.set(
          e?.status === 403
            ? 'Solo un super-admin de plataforma puede gestionar empresas.'
            : 'No se pudo conectar con la API (puerto 5045).'
        )
        this.cargando.set(false)
      },
    })
  }

  abrirCrear(): void {
    this.editId.set(null)
    this.form = { id: '', nombre: '', moduloInventario: true, moduloSpa: false }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(e: Empresa): void {
    this.editId.set(e.id)
    this.form = {
      id: e.id,
      nombre: e.nombre,
      moduloInventario: e.moduloInventario,
      moduloSpa: e.moduloSpa,
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  guardar(): void {
    const id = this.editId()
    if (!id) {
      if (!this.form.id.trim() || !this.form.nombre.trim()) {
        this.aviso.set('El identificador y el nombre son obligatorios.')
        return
      }
      this.guardando.set(true)
      this.svc
        .crear({
          id: this.form.id,
          nombre: this.form.nombre,
          moduloInventario: this.form.moduloInventario,
          moduloSpa: this.form.moduloSpa,
        })
        .subscribe({ next: () => this.finOk(), error: (e) => this.finError(e) })
      return
    }
    this.guardando.set(true)
    this.svc
      .actualizar(id, {
        nombre: this.form.nombre,
        moduloInventario: this.form.moduloInventario,
        moduloSpa: this.form.moduloSpa,
      })
      .subscribe({ next: () => this.finOk(), error: (e) => this.finError(e) })
  }

  private finOk(): void {
    this.guardando.set(false)
    this.mostrarForm.set(false)
    this.cargar()
  }

  private finError(e: unknown): void {
    this.guardando.set(false)
    const err = e as { error?: unknown }
    this.aviso.set(typeof err?.error === 'string' ? err.error : 'No se pudo guardar la empresa.')
  }
}
