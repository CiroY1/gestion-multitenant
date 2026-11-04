import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { Products } from './components/products/products'
import { Shipping } from './components/shipping/shipping'
import { Billing } from './components/billing/billing'
import { Delivery } from './components/delivery/delivery'

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    PageTitle,
    Products,
    Shipping,
    Billing,
    Delivery,
  ],
  templateUrl: './order-details.html',
  styles: ``,
})
export class OrderDetails {}
