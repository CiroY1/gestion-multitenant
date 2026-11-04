import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { SelectFormInputDirective } from '@/app/directive/select-form-input.directive'
import { Component } from '@angular/core'

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [
    PageTitle,
    SelectFormInputDirective,
    UIExamplesList,
  ],
  templateUrl: './select.html',
  styles: ``,
})
export class Select {}
