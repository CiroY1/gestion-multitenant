import { PageTitle } from '@/app/components/page-title'
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [PageTitle, NgbNavModule],
  templateUrl: './wizard.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Wizard {
  active = 1
  activeId = 1
}
