import { LogoBox } from '@/app/components/logo-box'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [LogoBox, RouterLink],
  templateUrl: './lock-screen.html',
  styles: ``,
})
export class LockScreen {}
