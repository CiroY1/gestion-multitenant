import { LogoBox } from '@/app/components/logo-box'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-reset-pass',
  standalone: true,
  imports: [LogoBox, RouterLink],
  templateUrl: './reset-pass.html',
  styles: ``,
})
export class ResetPass {}
