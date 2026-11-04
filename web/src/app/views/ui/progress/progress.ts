import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [PageTitle, NgbProgressbarModule, UIExamplesList],
  templateUrl: './progress.html',
  styles: ``,
})
export class Progress {}
