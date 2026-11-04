import { Component } from '@angular/core'
import { PageTitle } from '@/app/components/page-title'

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [PageTitle],
  templateUrl: './welcome.html',
  styles: ``,
})
export class Welcome {}
