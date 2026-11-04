import { PageTitle } from '@/app/components/page-title'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { State } from './components/state/state'
import { Revenue } from './components/revenue/revenue'
import { Expenses } from './components/expenses/expenses'
import { Transaction } from './components/transaction/transaction'
import { RevenueSources } from './components/revenue-sources/revenue-sources'

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    PageTitle,
    State,
    Revenue,
    Expenses,
    Transaction,
    RevenueSources,
  ],
  templateUrl: './finance.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Finance {}
