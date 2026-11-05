import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SpaService, type Bono, type Paquete } from '../spa.service'
import { TercerosService, type Cliente } from '../../terceros/terceros.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

@Component({
  selector: 'app-spa-bonos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './bonos.html',
})
export class Bonos implements OnInit {
  private spa = inject(SpaService)
  private terceros = inject(TercerosService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }

  bonos = signal<Bono[]>([])
  clientes = signal<Cliente[]>([])
  paquetes = signal<Paquete[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  procesando = signal<number | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  form = { clienteId: 0, paqueteId: 0 }

  ngOnInit(): void {
    this.cargar()
    this.terceros.getClientes().subscribe({
      next: (c) => this.clientes.set(c),
      error: () => {},
    })
    this.spa.getPaquetes().subscribe({
      next: (p) => this.paquetes.set(p.filter((x) => x.activo)),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getBonos().subscribe({
      next: (d) => {
        this.bonos.set(d)
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
    this.form = {
      clienteId: this.clientes()[0]?.id ?? 0,
      paqueteId: this.paquetes()[0]?.id ?? 0,
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  vender(): void {
    if (!this.form.clienteId || !this.form.paqueteId) {
      this.aviso.set('Selecciona un cliente y un paquete.')
      return
    }
    this.guardando.set(true)
    this.spa.venderBono(this.form.clienteId, this.form.paqueteId).subscribe({
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
            : 'No se pudo vender el bono.'
        )
      },
    })
  }

  consumir(b: Bono): void {
    this.procesando.set(b.id)
    this.spa.consumirBono(b.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(
          typeof e?.error?.message === 'string'
            ? e.error.message
            : 'No se pudo consumir una sesión.'
        )
      },
    })
  }

  eliminar(b: Bono): void {
    if (!confirm(`¿Eliminar el bono de "${b.clienteNombre}"?`)) return
    this.aviso.set(null)
    this.spa.eliminarBono(b.id).subscribe({
      next: () => this.cargar(),
      error: () => this.aviso.set('No se pudo eliminar el bono.'),
    })
  }

  agotado(b: Bono): boolean {
    return b.sesionesRestantes <= 0
  }
}
