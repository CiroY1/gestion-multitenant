import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [PageTitle, UIExamplesList],
  templateUrl: './breadcrumb.html',
  styles: ``,
})
export class Breadcrumb {}
