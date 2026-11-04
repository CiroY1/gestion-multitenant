import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'

@Component({
  selector: 'app-list-group',
  standalone: true,
  imports: [PageTitle, UIExamplesList],
  templateUrl: './list-group.html',
  styles: ``,
})
export class ListGroup {}
