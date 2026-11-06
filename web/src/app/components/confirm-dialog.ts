import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ConfirmService } from '@/app/core/services/confirm.service'

/**
 * Modal de confirmación global (reemplaza el confirm() nativo). Se monta una
 * sola vez en el layout privado y reacciona al ConfirmService.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.visible() && svc.opts(); as o) {
      <div class="modal fade show d-block" tabindex="-1" (click)="svc.responder(false)">
        <div class="modal-dialog modal-dialog-centered modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ o.titulo }}</h5>
              <button type="button" class="btn-close" aria-label="Cerrar" (click)="svc.responder(false)"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex gap-3">
                <div class="avatar-sm flex-shrink-0">
                  <span class="avatar-title rounded-circle fs-22"
                        [class.bg-danger-subtle]="o.peligro" [class.text-danger]="o.peligro"
                        [class.bg-primary-subtle]="!o.peligro" [class.text-primary]="!o.peligro">
                    <i class="bx" [class.bx-error-circle]="o.peligro" [class.bx-help-circle]="!o.peligro"></i>
                  </span>
                </div>
                <p class="mb-0 align-self-center">{{ o.mensaje }}</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-light" (click)="svc.responder(false)">{{ o.cancelar }}</button>
              <button class="btn" [class.btn-danger]="o.peligro" [class.btn-primary]="!o.peligro"
                      (click)="svc.responder(true)">{{ o.confirmar }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    }
  `,
})
export class ConfirmDialog {
  svc = inject(ConfirmService)
}
