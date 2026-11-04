import { currency } from '@/app/common/constants'
import { Component } from '@angular/core'

@Component({
  selector: 'order-detail-products',
  standalone: true,
  imports: [],
  templateUrl: './products.html',
  styles: ``,
})
export class Products {
  currency = currency
}
