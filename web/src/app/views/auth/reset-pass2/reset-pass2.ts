import { LogoBox } from '@/app/components/logo-box'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-reset-pass2',
  standalone: true,
  imports: [LogoBox, RouterLink],
  templateUrl: './reset-pass2.html',
  styles: ``,
})
export class ResetPass2 {}
