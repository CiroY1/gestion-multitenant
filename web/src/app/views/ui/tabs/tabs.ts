import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [PageTitle, NgbNavModule, UIExamplesList],
  templateUrl: './tabs.html',
  styles: ``,
})
export class Tabs {}
