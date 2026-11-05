import { PageTitle } from '@/app/components/page-title'
import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import {
  InventarioService,
  type DocumentoDetalle,
  type EstadoDocumento,
  type Nota,
  type TipoNota,
} from '../inventario.service'

/** Forma mínima común de recepción/remisión usada para poblar el selector. */
interface DocumentoResumen {
  id: number
  numero: string
  estado: EstadoDocumento
}

interface LineaForm {
  productoId: number
  producto: string
  max: number
  cantidad: number
  incluir: boolean
}

@Component({
  selector: 'app-inventario-notas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitle],
  templateUrl: './notas.html',
})
export class Notas implements OnInit {
  private inv = inject(InventarioService)

  notas = signal<Nota[]>([])
  cargando = signal(true)
  error = signal<string | null>(null)
  aviso = signal<string | null>(null)
  procesando = signal<number | null>(null)

  mostrarForm = signal(false)
  guardando = signal(false)
  errorForm = signal<string | null>(null)

  // Formulario
  tipo: TipoNota = 'Credito'
  documentos = signal<{ id: number; numero: string }[]>([])
  documentoOrigenId: number | null = null
  motivo = ''
  lineas = signal<LineaForm[]>([])
  cargandoDocs = signal(false)
  cargandoLineas = signal(false)

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.error.set(null)
    this.inv.getNotas().subscribe({
      next: (d) => {
        this.notas.set(d)
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('No se pudo conectar con la API (puerto 5045).')
        this.cargando.set(false)
      },
    })
  }

  abrirForm(): void {
    this.tipo = 'Credito'
    this.documentoOrigenId = null
    this.motivo = ''
    this.lineas.set([])
    this.errorForm.set(null)
    this.mostrarForm.set(true)
    this.cargarDocumentos()
  }

  /** La nota crédito devuelve sobre remisiones; la débito sobre recepciones. */
  cargarDocumentos(): void {
    this.documentoOrigenId = null
    this.lineas.set([])
    this.cargandoDocs.set(true)
    const obs: Observable<DocumentoResumen[]> =
      this.tipo === 'Credito' ? this.inv.getRemisiones() : this.inv.getRecepciones()
    obs.subscribe({
      next: (docs) => {
        this.documentos.set(
          docs
            .filter((d) => d.estado === 'Confirmado')
            .map((d) => ({ id: d.id, numero: d.numero }))
        )
        this.cargandoDocs.set(false)
      },
      error: () => this.cargandoDocs.set(false),
    })
  }

  onTipoChange(): void {
    this.cargarDocumentos()
  }

  /** Al elegir el documento origen, carga sus líneas para decidir qué devolver. */
  onDocumentoChange(): void {
    if (!this.documentoOrigenId) {
      this.lineas.set([])
      return
    }
    this.cargandoLineas.set(true)
    const obs: Observable<DocumentoDetalle> =
      this.tipo === 'Credito'
        ? this.inv.getRemision(this.documentoOrigenId)
        : this.inv.getRecepcion(this.documentoOrigenId)
    obs.subscribe({
      next: (det) => {
        this.lineas.set(
          det.lineas.map((l) => ({
            productoId: l.productoId,
            producto: l.producto ?? `#${l.productoId}`,
            max: l.cantidad,
            cantidad: l.cantidad,
            incluir: true,
          }))
        )
        this.cargandoLineas.set(false)
      },
      error: () => {
        this.cargandoLineas.set(false)
        this.errorForm.set('No se pudieron cargar las líneas del documento.')
      },
    })
  }

  guardar(): void {
    this.errorForm.set(null)
    if (!this.documentoOrigenId) {
      this.errorForm.set('Selecciona el documento origen.')
      return
    }
    const seleccionadas = this.lineas().filter((l) => l.incluir && l.cantidad > 0)
    if (seleccionadas.length === 0) {
      this.errorForm.set('Incluye al menos un producto con cantidad mayor a 0.')
      return
    }
    if (seleccionadas.some((l) => l.cantidad > l.max)) {
      this.errorForm.set('No puedes devolver más de la cantidad del documento origen.')
      return
    }

    this.guardando.set(true)
    this.inv
      .crearNota({
        tipo: this.tipo,
        documentoOrigenId: this.documentoOrigenId,
        motivo: this.motivo,
        lineas: seleccionadas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false)
          this.mostrarForm.set(false)
          this.cargar()
        },
        error: (e) => {
          this.guardando.set(false)
          this.errorForm.set(typeof e?.error === 'string' ? e.error : 'No se pudo crear la nota.')
        },
      })
  }

  pdf(n: Nota): void {
    this.inv.abrirPdf('notas', n.id, n.numero)
  }

  confirmar(n: Nota): void {
    this.aviso.set(null)
    this.procesando.set(n.id)
    this.inv.confirmarNota(n.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo confirmar.')
      },
    })
  }

  anular(n: Nota): void {
    if (!confirm(`¿Anular ${n.numero}? Si estaba confirmada, se revertirá el stock.`)) return
    this.aviso.set(null)
    this.procesando.set(n.id)
    this.inv.anularNota(n.id).subscribe({
      next: () => {
        this.procesando.set(null)
        this.cargar()
      },
      error: (e) => {
        this.procesando.set(null)
        this.aviso.set(typeof e?.error === 'string' ? e.error : 'No se pudo anular.')
      },
    })
  }
}
