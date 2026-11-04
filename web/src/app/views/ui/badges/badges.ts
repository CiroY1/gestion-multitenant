import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'

@Component({
  selector: 'app-badges',
  standalone: true,
  imports: [PageTitle, UIExamplesList],
  templateUrl: './badges.html',
  styles: ``,
})
export class Badges {
  badges = [
    'Primary',
    'Secondary',
    'Success',
    'Info',
    'Warning',
    'Danger',
    'Dark',
    'Purple',
    'Pink',
    'Orange',
  ]
}
