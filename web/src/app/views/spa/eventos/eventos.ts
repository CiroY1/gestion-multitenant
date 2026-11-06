import { PageTitle } from '@/app/components/page-title'
import { ConfirmService } from '@/app/core/services/confirm.service'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  SpaService,
  type Bebe,
  type Evento,
  type Inscripcion,
  type Sala,
  type Trabajador,
} from '../spa.service'
import { AuthenticationService } from '@/app/core/services/auth.service'

@Component({
  selector: 'app-spa-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './eventos.html',
})
export class Eventos implements OnInit {
  private spa = inject(SpaService)
  private confirm = inject(ConfirmService)
  private auth = inject(AuthenticationService)

  get esAdmin(): boolean {
    return this.auth.esAdmin
  }

  eventos = signal<Evento[]>([])
  trabajadores = signal<Trabajador[]>([])
  salas = signal<Sala[]>([])
  bebes = signal<Bebe[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  // Crear evento.
  mostrarForm = signal(false)
  guardando = signal(false)
  form = {
    titulo: '',
    fechaHora: '',
    duracionMin: 60,
    cupo: 10,
    trabajadorId: 0,
    salaId: 0,
    notas: '',
  }

  // Inscripciones.
  eventoSel = signal<Evento | null>(null)
  inscripciones = signal<Inscripcion[]>([])
  cargandoIns = signal(false)
  procesandoIns = signal(false)
  bebeAInscribir = 0

  ngOnInit(): void {
    this.cargar()
    this.spa.getTrabajadores().subscribe({
      next: (t) => this.trabajadores.set(t.filter((x) => x.activo)),
      error: () => {},
    })
    this.spa.getSalas().subscribe({
      next: (s) => this.salas.set(s.filter((x) => x.activa)),
      error: () => {},
    })
    this.spa.getBebes().subscribe({
      next: (b) => this.bebes.set(b),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getEventos().subscribe({
      next: (d) => {
        this.eventos.set(d)
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
      titulo: '',
      fechaHora: '',
      duracionMin: 60,
      cupo: 10,
      trabajadorId: 0,
      salaId: 0,
      notas: '',
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  crear(): void {
    if (!this.form.titulo.trim() || !this.form.fechaHora || this.form.cupo < 1) {
      this.aviso.set('Título, fecha/hora y un cupo mayor a 0 son obligatorios.')
      return
    }
    this.guardando.set(true)
    this.spa
      .crearEvento({
        titulo: this.form.titulo,
        fechaHora: this.form.fechaHora,
        duracionMin: this.form.duracionMin,
        cupo: this.form.cupo,
        trabajadorId: this.form.trabajadorId || undefined,
        salaId: this.form.salaId || undefined,
        notas: this.form.notas,
      })
      .subscribe({
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
              : 'No se pudo crear el evento.'
          )
        },
      })
  }

  async eliminar(e: Evento): Promise<void> {
    if (!(await this.confirm.ask({ mensaje: `¿Eliminar el evento "${e.titulo}" y sus inscripciones?`, titulo: 'Eliminar' }))) return
    this.aviso.set(null)
    this.spa.eliminarEvento(e.id).subscribe({
      next: () => this.cargar(),
      error: () => this.aviso.set('No se pudo eliminar el evento.'),
    })
  }

  // --- Inscripciones ---

  abrirInscripciones(e: Evento): void {
    this.eventoSel.set(e)
    this.bebeAInscribir = 0
    this.aviso.set(null)
    this.cargarInscripciones(e.id)
  }

  cerrarInscripciones(): void {
    this.eventoSel.set(null)
    this.inscripciones.set([])
  }

  private cargarInscripciones(eventoId: number): void {
    this.cargandoIns.set(true)
    this.spa.getInscripciones(eventoId).subscribe({
      next: (d) => {
        this.inscripciones.set(d)
        this.cargandoIns.set(false)
      },
      error: () => this.cargandoIns.set(false),
    })
  }

  inscribir(): void {
    const ev = this.eventoSel()
    if (!ev || !this.bebeAInscribir) return
    this.procesandoIns.set(true)
    this.spa.inscribir(ev.id, this.bebeAInscribir).subscribe({
      next: () => {
        this.procesandoIns.set(false)
        this.bebeAInscribir = 0
        this.cargarInscripciones(ev.id)
        this.cargar()
      },
      error: (e) => {
        this.procesandoIns.set(false)
        this.aviso.set(
          typeof e?.error?.message === 'string'
            ? e.error.message
            : 'No se pudo inscribir.'
        )
      },
    })
  }

  desinscribir(ins: Inscripcion): void {
    const ev = this.eventoSel()
    if (!ev) return
    this.procesandoIns.set(true)
    this.spa.desinscribir(ev.id, ins.id).subscribe({
      next: () => {
        this.procesandoIns.set(false)
        this.cargarInscripciones(ev.id)
        this.cargar()
      },
      error: () => this.procesandoIns.set(false),
    })
  }

  lleno(e: Evento): boolean {
    return e.inscritos >= e.cupo
  }
}
