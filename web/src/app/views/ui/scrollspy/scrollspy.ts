import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import {
  NgbDropdownModule,
  NgbScrollSpyModule,
} from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-scrollspy',
  standalone: true,
  imports: [PageTitle, NgbScrollSpyModule, NgbDropdownModule],
  templateUrl: './scrollspy.html',
  styles: ``,
})
export class Scrollspy {}
