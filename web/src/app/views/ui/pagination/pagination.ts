import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [PageTitle, NgbPaginationModule, UIExamplesList],
  templateUrl: './pagination.html',
  styles: ``,
})
export class Pagination {}
