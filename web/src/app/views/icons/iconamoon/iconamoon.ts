import { PageTitle } from '@/app/components/page-title'
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'

@Component({
  selector: 'app-iconamoon',
  standalone: true,
  imports: [PageTitle],
  templateUrl: './iconamoon.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Iconamoon {}
