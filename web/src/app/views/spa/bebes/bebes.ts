import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SpaService, type Bebe } from '../spa.service'
import { TercerosService, type Cliente } from '../../terceros/terceros.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

/** Rango de elegibilidad por edad para el spa de bebés. */
const MIN_DIAS = 14 // 2 semanas
const MAX_DIAS = 365 // 12 meses

@Component({
  selector: 'app-spa-bebes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './bebes.html',
})
export class Bebes implements OnInit {
  private spa = inject(SpaService)
  private terceros = inject(TercerosService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }

  bebes = signal<Bebe[]>([])
  clientes = signal<Cliente[]>([])

  total = computed(() => this.bebes().length)
  elegibles = computed(
    () =>
      this.bebes().filter((b) => {
        const d = this.diasDeVida(b.fechaNacimiento)
        return d >= MIN_DIAS && d <= MAX_DIAS
      }).length
  )
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  editId = signal<number | null>(null)
  form = {
    nombre: '',
    clienteId: 0,
    fechaNacimiento: '',
    peso: null as number | null,
    alergias: '',
    notas: '',
  }

  ngOnInit(): void {
    this.cargar()
    this.terceros.getClientes().subscribe({
      next: (c) => this.clientes.set(c),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getBebes().subscribe({
      next: (d) => {
        this.bebes.set(d)
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
    this.form = {
      nombre: '',
      clienteId: 0,
      fechaNacimiento: '',
      peso: null,
      alergias: '',
      notas: '',
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  abrirEditar(b: Bebe): void {
    this.editId.set(b.id)
    this.form = {
      nombre: b.nombre,
      clienteId: b.clienteId ?? 0,
      fechaNacimiento: b.fechaNacimiento,
      peso: b.peso,
      alergias: b.alergias,
      notas: b.notas,
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.fechaNacimiento) {
      this.aviso.set('El nombre y la fecha de nacimiento son obligatorios.')
      return
    }
    this.guardando.set(true)
    const dto = {
      nombre: this.form.nombre,
      clienteId: this.form.clienteId || undefined,
      fechaNacimiento: this.form.fechaNacimiento,
      peso: this.form.peso,
      alergias: this.form.alergias,
      notas: this.form.notas,
    }
    const id = this.editId()
    const obs = id ? this.spa.actualizarBebe(id, dto) : this.spa.crearBebe(dto)
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
            : 'No se pudo guardar la ficha.'
        )
      },
    })
  }

  eliminar(b: Bebe): void {
    if (!confirm(`¿Eliminar la ficha de "${b.nombre}"?`)) return
    this.aviso.set(null)
    this.spa.eliminarBebe(b.id).subscribe({
      next: () => this.cargar(),
      error: () => this.aviso.set('No se pudo eliminar.'),
    })
  }

  private diasDeVida(fn: string): number {
    const n = new Date(fn + 'T00:00:00')
    if (Number.isNaN(n.getTime())) return -1
    return Math.floor((Date.now() - n.getTime()) / 86_400_000)
  }

  edadTexto(fn: string): string {
    const d = this.diasDeVida(fn)
    if (d < 0) return '—'
    if (d < 7) return d === 1 ? '1 día' : `${d} días`
    if (d < 60) {
      const sem = Math.floor(d / 7)
      return sem === 1 ? '1 semana' : `${sem} semanas`
    }
    const meses = Math.floor(d / 30.44)
    const sem = Math.floor((d - meses * 30.44) / 7)
    const mesTxt = meses === 1 ? '1 mes' : `${meses} meses`
    return sem > 0 ? `${mesTxt} y ${sem} sem` : mesTxt
  }

  elegibilidad(fn: string): { label: string; cls: string } {
    const d = this.diasDeVida(fn)
    if (d < 0) return { label: '—', cls: 'bg-light text-muted' }
    if (d < MIN_DIAS) return { label: 'Muy pequeño', cls: 'bg-warning-subtle text-warning' }
    if (d > MAX_DIAS) return { label: 'Fuera de rango', cls: 'bg-danger-subtle text-danger' }
    return { label: 'Elegible', cls: 'bg-success-subtle text-success' }
  }
}
