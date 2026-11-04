import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { Filter } from './components/filter/filter'
import { InventoryProduct } from './components/inventory-product/inventory-product'

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [PageTitle, Filter, InventoryProduct],
  templateUrl: './inventory.html',
  styles: ``,
})
export class Inventory {}
