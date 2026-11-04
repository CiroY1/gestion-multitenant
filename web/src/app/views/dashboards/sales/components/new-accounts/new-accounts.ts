import { Component } from '@angular/core'
import { accountData } from '../../data'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'sales-new-accounts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-accounts.html',
  styles: ``,
})
export class NewAccounts {
  accountList = accountData
}
