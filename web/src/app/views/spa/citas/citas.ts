import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  SpaService,
  type Cita,
  type Sala,
  type ServicioSpa,
  type Trabajador,
} from '../spa.service'
import { TercerosService, type Cliente } from '../../terceros/terceros.service'

@Component({
  selector: 'app-spa-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './citas.html',
})
export class Citas implements OnInit {
  private spa = inject(SpaService)
  private terceros = inject(TercerosService)

  citas = signal<Cita[]>([])
  servicios = signal<ServicioSpa[]>([])
  clientes = signal<Cliente[]>([])
  trabajadores = signal<Trabajador[]>([])
  salas = signal<Sala[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  procesando = signal<number | null>(null)

  form = {
    servicioId: 0,
    clienteId: 0,
    trabajadorId: 0,
    salaId: 0,
    bebeNombre: '',
    fechaHora: '',
    notas: '',
  }

  programadas = computed(
    () => this.citas().filter((c) => c.estado === 'Programada').length
  )

  ngOnInit(): void {
    this.cargar()
    this.spa.getServicios().subscribe({
      next: (s) => this.servicios.set(s.filter((x) => x.activo)),
      error: () => {},
    })
    this.terceros.getClientes().subscribe({
      next: (c) => this.clientes.set(c),
      error: () => {},
    })
    this.spa.getTrabajadores().subscribe({
      next: (t) => this.trabajadores.set(t.filter((x) => x.activo)),
      error: () => {},
    })
    this.spa.getSalas().subscribe({
      next: (s) => this.salas.set(s.filter((x) => x.activa)),
      error: () => {},
    })
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.spa.getCitas().subscribe({
      next: (d) => {
        this.citas.set(d)
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
      servicioId: this.servicios()[0]?.id ?? 0,
      clienteId: this.clientes()[0]?.id ?? 0,
      trabajadorId: 0,
      salaId: 0,
      bebeNombre: '',
      fechaHora: '',
      notas: '',
    }
    this.aviso.set(null)
    this.mostrarForm.set(true)
  }

  crear(): void {
    if (!this.form.servicioId || !this.form.clienteId || !this.form.fechaHora) {
      this.aviso.set('Servicio, cliente y fecha/hora son obligatorios.')
      return
    }
    this.guardando.set(true)
    this.spa
      .crearCita({
        servicioId: this.form.servicioId,
        clienteId: this.form.clienteId,
        trabajadorId: this.form.trabajadorId || undefined,
        salaId: this.form.salaId || undefined,
        bebeNombre: this.form.bebeNombre,
        fechaHora: this.form.fechaHora,
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
              : 'No se pudo crear la cita.'
          )
        },
      })
  }

  atender(c: Cita): void {
    this.procesando.set(c.id)
    this.spa.atenderCita(c.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(
          typeof e?.error?.message === 'string' ? e.error.message : 'No se pudo atender.'
        )
      },
    })
  }

  cancelar(c: Cita): void {
    if (!confirm(`¿Cancelar la cita de ${c.clienteNombre}?`)) return
    this.procesando.set(c.id)
    this.spa.cancelarCita(c.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(
          typeof e?.error?.message === 'string' ? e.error.message : 'No se pudo cancelar.'
        )
      },
    })
  }

  badge(e: Cita['estado']): string {
    if (e === 'Atendida') return 'bg-success-subtle text-success'
    if (e === 'Cancelada') return 'bg-danger-subtle text-danger'
    return 'bg-warning-subtle text-warning'
  }
}
