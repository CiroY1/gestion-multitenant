import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'
import { SimplebarAngularModule } from 'simplebar-angular'

@Component({
  selector: 'app-scrollbar',
  standalone: true,
  imports: [
    PageTitle,
    SimplebarAngularModule,
    UIExamplesList,
  ],
  templateUrl: './scrollbar.html',
  styles: ``,
})
export class Scrollbar {}
