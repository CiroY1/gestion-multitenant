import { PageTitle } from '@/app/components/page-title'
import { TableService } from '@/app/core/services/table.service'
import { NgbdSortableHeader } from '@/app/directive/sortable.directive'
import { Component, inject, ViewChildren, type QueryList } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  NgbDropdownModule,
  NgbNavModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap'
import { CustomerGrid } from './components/customer-grid/customer-grid'
import { CustomerList } from './components/customer-list/customer-list'
import { type CustomerType } from './data'

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    PageTitle,
    CustomerList,
    CustomerGrid,
    NgbNavModule,
    NgbDropdownModule,
    FormsModule,
    NgbTooltipModule,
  ],
  templateUrl: './customers.html',
  styles: ``,
})
export class Customers {
  active = 2
  sort!: '' | keyof CustomerType

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<
    NgbdSortableHeader<CustomerType>
  >

  public tableService = inject(TableService<CustomerType>)

  sortData(column: any) {
    this.sort = column
    this.onSort()
  }

  onSort() {
    const column = this.sort
    this.headers.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = ''
      }
    })

    this.tableService.sortColumn = column
  }
}
