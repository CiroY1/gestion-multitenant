import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { contactData } from './data'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [PageTitle, RouterLink],
  templateUrl: './contacts.html',
  styles: ``,
})
export class Contacts {
  contactList = contactData
}
