import { Injectable, signal } from '@angular/core'

export interface ConfirmOpts {
  titulo?: string
  mensaje: string
  /** Texto del botón de confirmar. */
  confirmar?: string
  /** Texto del botón de cancelar. */
  cancelar?: string
  /** true = botón de confirmar en rojo (acción destructiva). */
  peligro?: boolean
}

/**
 * Confirmaciones con un modal propio (en vez del confirm() nativo del
 * navegador). `ask()` devuelve una promesa que resuelve true/false. El modal lo
 * pinta <app-confirm-dialog>, montado una vez en el layout privado.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly visible = signal(false)
  readonly opts = signal<Required<ConfirmOpts> | null>(null)
  private resolver: ((v: boolean) => void) | null = null

  ask(opts: ConfirmOpts): Promise<boolean> {
    this.opts.set({
      titulo: opts.titulo ?? 'Confirmar',
      mensaje: opts.mensaje,
      confirmar: opts.confirmar ?? 'Confirmar',
      cancelar: opts.cancelar ?? 'Cancelar',
      peligro: opts.peligro ?? true,
    })
    this.visible.set(true)
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve
    })
  }

  responder(valor: boolean): void {
    this.visible.set(false)
    const r = this.resolver
    this.resolver = null
    if (r) r(valor)
  }
}
