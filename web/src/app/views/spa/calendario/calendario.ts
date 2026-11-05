import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FullCalendarModule } from '@fullcalendar/angular'
import type { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import esLocale from '@fullcalendar/core/locales/es'
import { forkJoin } from 'rxjs'
import { SpaService, type Cita, type Tarea } from '../spa.service'

interface DetalleEvento {
  tipo: 'Cita' | 'Tarea'
  titulo: string
  cuando: string
  estado: string
  extra: string
}

@Component({
  selector: 'app-spa-calendario',
  standalone: true,
  imports: [CommonModule, PageTitle, FullCalendarModule],
  templateUrl: './calendario.html',
})
export class Calendario implements OnInit {
  private spa = inject(SpaService)

  cargando = signal(true)
  error = signal<string | null>(null)
  detalle = signal<DetalleEvento | null>(null)

  calendarOptions: CalendarOptions = {
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      interactionPlugin,
      bootstrapPlugin,
    ],
    themeSystem: 'bootstrap',
    locale: esLocale,
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    height: 'auto',
    nowIndicator: true,
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    events: [],
    eventClick: (arg) => this.abrirDetalle(arg),
  }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    forkJoin({
      citas: this.spa.getCitas(),
      tareas: this.spa.getTareas(),
    }).subscribe({
      next: ({ citas, tareas }) => {
        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...this.mapCitas(citas), ...this.mapTareas(tareas)],
        }
        this.cargando.set(false)
      },
      error: (e) => {
        this.error.set(
          e?.status === 403
            ? 'Tu empresa no tiene activo el módulo spa.'
            : 'No se pudo cargar la agenda (segundo backend, puerto 5046).'
        )
        this.cargando.set(false)
      },
    })
  }

  private colorCita(estado: Cita['estado']): string {
    if (estado === 'Atendida') return '#22c55e'
    if (estado === 'Cancelada') return '#ef4444'
    return '#f59e0b'
  }

  private mapCitas(citas: Cita[]): EventInput[] {
    return citas.map((c) => {
      const start = new Date(c.fechaHora)
      const end = new Date(start.getTime() + (c.duracionMin || 30) * 60000)
      const extra = [
        c.trabajadorNombre ? `Terapeuta: ${c.trabajadorNombre}` : '',
        c.bebeNombre ? `Bebé: ${c.bebeNombre}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
      return {
        id: `cita-${c.id}`,
        title: `${c.clienteNombre} · ${c.servicioNombre}`,
        start,
        end,
        backgroundColor: this.colorCita(c.estado),
        borderColor: this.colorCita(c.estado),
        extendedProps: { tipo: 'Cita', estado: c.estado, extra },
      }
    })
  }

  private mapTareas(tareas: Tarea[]): EventInput[] {
    return tareas.map((t) => ({
      id: `tarea-${t.id}`,
      title: `Tarea: ${t.titulo}`,
      start: new Date(t.fechaHora),
      backgroundColor: '#6366f1',
      borderColor: '#6366f1',
      extendedProps: {
        tipo: 'Tarea',
        estado: t.estado,
        extra: t.trabajadorNombre ? `Responsable: ${t.trabajadorNombre}` : '',
      },
    }))
  }

  private abrirDetalle(arg: EventClickArg): void {
    const p = arg.event.extendedProps as { tipo: 'Cita' | 'Tarea'; estado: string; extra: string }
    this.detalle.set({
      tipo: p.tipo,
      titulo: arg.event.title,
      cuando: arg.event.start ? arg.event.start.toLocaleString() : '',
      estado: p.estado,
      extra: p.extra,
    })
  }
}
