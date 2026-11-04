import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { Compose } from './components/compose/compose'
import { EmailList } from './components/email-list/email-list'
import { EmailTopbar } from './components/email-topbar/email-topbar'

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [PageTitle, Compose, EmailTopbar],
  templateUrl: './email.html',
  styles: ``,
})
export class Email {}
