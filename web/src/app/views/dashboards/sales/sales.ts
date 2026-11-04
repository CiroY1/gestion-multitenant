import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { Overview } from './components/overview/overview'
import { SalesByCategory } from './components/sales-by-category/sales-by-category'
import { NewAccounts } from './components/new-accounts/new-accounts'
import { RecentTransaction } from './components/recent-transaction/recent-transaction'
import { RecentOrders } from './components/recent-orders/recent-orders'
import { StateCard } from '@/app/components/state-card/state-card'

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    PageTitle,
    StateCard,
    Overview,
    SalesByCategory,
    NewAccounts,
    RecentTransaction,
    RecentOrders,
  ],
  templateUrl: './sales.html',
  styles: ``,
})
export class Sales {}
