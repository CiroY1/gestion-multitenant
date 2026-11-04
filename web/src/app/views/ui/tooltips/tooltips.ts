import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-tooltips',
  standalone: true,
  imports: [PageTitle, NgbTooltipModule, UIExamplesList],
  templateUrl: './tooltips.html',
  styles: ``,
})
export class Tooltips {}
