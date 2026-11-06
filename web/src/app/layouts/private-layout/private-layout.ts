import { Component, inject } from '@angular/core'
import { Store } from '@ngrx/store'
import { Vertical } from '../vertical/vertical'
import { ConfirmDialog } from '@/app/components/confirm-dialog'

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [Vertical, ConfirmDialog],
  template: `
    <app-vertical></app-vertical>
    <app-confirm-dialog />
  `,
  styles: ``,
})
export class PrivateLayout {
  layoutType: any

  private store = inject(Store)

  ngOnInit(): void {
    this.store.select('layout').subscribe((data) => {
      this.layoutType = data.LAYOUT
      document.documentElement.setAttribute('data-bs-theme', data.LAYOUT_THEME)

      document.documentElement.setAttribute('data-menu-color', data.MENU_COLOR)
      document.documentElement.setAttribute(
        'data-topbar-color',
        data.TOPBAR_COLOR
      )
      document.documentElement.setAttribute('data-menu-size', data.MENU_SIZE)
    })
  }
}
