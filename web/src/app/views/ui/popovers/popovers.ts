import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-popovers',
  standalone: true,
  imports: [PageTitle, NgbPopoverModule, UIExamplesList],
  templateUrl: './popovers.html',
  styles: ``,
})
export class Popovers {}
