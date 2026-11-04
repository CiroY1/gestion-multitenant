import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-buttons',
  standalone: true,
  imports: [
    PageTitle,
    CommonModule,
    NgbDropdownModule,
    UIExamplesList,
  ],
  templateUrl: './buttons.html',
  styles: ``,
})
export class Buttons {
  buttons = [
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
    'Light',
    'Link',
  ]
  outlineButton = [
    'Primary',
    'Secondary',
    'Success',
    'Info',
    'Warning',
    'Purple',
    'Pink',
    'Orange',
  ]
}
