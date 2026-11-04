import { LogoBox } from '@/app/components/logo-box'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-error-404',
  standalone: true,
  imports: [LogoBox, RouterLink],
  templateUrl: './error-404.html',
  styles: ``,
})
export class Error404 {}
