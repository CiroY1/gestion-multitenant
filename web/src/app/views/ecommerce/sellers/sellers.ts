import { PageTitle } from '@/app/components/page-title'
import { Component, inject, ViewChildren, type QueryList } from '@angular/core'
import { SellerList } from './components/seller-list/seller-list'
import { SellerGrid } from './components/seller-grid/seller-grid'
import { NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import type { SellerType } from './data'
import { TableService } from '@/app/core/services/table.service'
import { FormsModule } from '@angular/forms'
import { NgbdSortableHeader } from '@/app/directive/sortable.directive'

@Component({
  selector: 'app-sellers',
  standalone: true,
  imports: [
    PageTitle,
    SellerList,
    SellerGrid,
    NgbNavModule,
    FormsModule,
    NgbTooltipModule,
  ],
  templateUrl: './sellers.html',
  styles: ``,
})
export class Sellers {
  sort!: '' | keyof SellerType

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<
    NgbdSortableHeader<SellerType>
  >

  public tableService = inject(TableService<SellerType>)

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
