import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  TemplateRef,
  inject,
} from '@angular/core'
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap'
import { ToastService } from './toast.service'
import { ToastsContainer } from './toasts-container'

@Component({
  selector: 'app-toastss',
  standalone: true,
  imports: [
    PageTitle,
    NgbToastModule,
    UIExamplesList,
    ToastsContainer,
  ],
  templateUrl: './toasts.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Toasts {
  toastService = inject(ToastService)
  liveToast = false
  show = true
  show1 = true
  show2 = true
  show3 = true

  close() {
    this.show = false
  }

  showStandard() {
    this.toastService.show({
      content: 'See Just like this',
      delay: 10000,
      classname: 'standard',
    })
  }

  showSuccess() {
    this.toastService.show({
      content: 'Heads up, toasts will stack automatically',
      delay: 10000,
      classname: 'standard',
    })
  }
}
