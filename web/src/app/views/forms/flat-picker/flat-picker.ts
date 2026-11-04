import { currentYear } from '@/app/common/constants'
import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { FlatpickrDirective } from '@/app/directive/flatpickr.directive'
import { Component } from '@angular/core'

@Component({
  selector: 'app-flat-picker',
  standalone: true,
  imports: [PageTitle, FlatpickrDirective, UIExamplesList],
  templateUrl: './flat-picker.html',
  styles: ``,
})
export class FlatPicker {
  currentYear = currentYear
}
