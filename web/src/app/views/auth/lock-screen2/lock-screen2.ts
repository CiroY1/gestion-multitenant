import { LogoBox } from '@/app/components/logo-box'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-lock-screen2',
  standalone: true,
  imports: [LogoBox, RouterLink],
  templateUrl: './lock-screen2.html',
  styles: ``,
})
export class LockScreen2 {}
