import { Component } from '@angular/core'
import {
  NgbAccordionModule,
  NgbScrollSpyModule,
} from '@ng-bootstrap/ng-bootstrap'
import { accordionItem } from './data'
import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'

@Component({
  selector: 'app-accordions',
  standalone: true,
  imports: [NgbAccordionModule, PageTitle, UIExamplesList],
  templateUrl: './accordions.html',
  styles: ``,
})
export class Accordions {
  accordionData = accordionItem
}
