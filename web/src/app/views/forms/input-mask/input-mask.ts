import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask'

@Component({
  selector: 'app-input-mask',
  standalone: true,
  imports: [PageTitle, NgxMaskDirective],
  templateUrl: './input-mask.html',
  styles: ``,
  providers: [provideNgxMask()],
})
export class InputMask {}
