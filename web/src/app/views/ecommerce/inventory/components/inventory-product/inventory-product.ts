import { Component } from '@angular/core'
import { inventoryList } from '../../data'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'inventory-product',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inventory-product.html',
  styles: ``,
})
export class InventoryProduct {
  inventoryData = inventoryList
}
