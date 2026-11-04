import { Component } from '@angular/core'
import { ContactForm } from './components/contact-form/contact-form'
import { Inquiries } from './components/inquiries/inquiries'

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [ContactForm, Inquiries],
  templateUrl: './contact-us.html',
  styles: ``,
})
export class ContactUs {}
