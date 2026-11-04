import { LogoBox } from '@/app/components/logo-box'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [LogoBox, RouterLink],
  templateUrl: './maintenance.html',
  styles: ``,
})
export class Maintenance {}
