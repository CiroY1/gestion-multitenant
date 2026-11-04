import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'contact-inquiries',
  standalone: true,
  imports: [NgbTooltipModule],
  templateUrl: './inquiries.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Inquiries {}
