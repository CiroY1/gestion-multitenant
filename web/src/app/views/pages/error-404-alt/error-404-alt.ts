import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-error-404-alt',
  standalone: true,
  imports: [PageTitle, RouterLink],
  templateUrl: './error-404-alt.html',
  styles: ``,
})
export class Error404Alt {}
