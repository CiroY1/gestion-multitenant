import { PageTitle } from '@/app/components/page-title'
import { Component, inject } from '@angular/core'
import { InvoicesData, type InvoiceType } from '../data'
import { CommonModule, DatePipe } from '@angular/common'
import type { Observable } from 'rxjs'
import { TableService } from '@/app/core/services/table.service'
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    PageTitle,
    DatePipe,
    CommonModule,
    NgbPaginationModule,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './invoices.html',
  styles: ``,
})
export class Invoices {
  invoices$: Observable<InvoiceType[]>
  total$: Observable<number>

  public tableService = inject(TableService<InvoiceType>)

  constructor() {
    this.invoices$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(InvoicesData, 10)
  }
}
