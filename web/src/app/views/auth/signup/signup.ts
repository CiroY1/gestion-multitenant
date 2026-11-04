import { LogoBox } from '@/app/components/logo-box'
import { SocialBtn } from '@/app/components/social-btn/social-btn'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [SocialBtn, LogoBox, RouterLink],
  templateUrl: './signup.html',
  styles: ``,
})
export class Signup {}
