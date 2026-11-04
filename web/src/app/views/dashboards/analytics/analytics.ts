import { PageTitle } from '@/app/components/page-title'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { State } from './components/state/state'
import { Conversation } from './components/conversation/conversation'
import { Performance } from './components/performance/performance'
import { Sessionbycounty } from './components/sessionbycounty/sessionbycounty'
import { Browser } from './components/browser/browser'
import { TopPage } from './components/top-page/top-page'

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    PageTitle,
    State,
    Conversation,
    Performance,
    Sessionbycounty,
    Browser,
    TopPage,
    Browser,
  ],
  templateUrl: './analytics.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Analytics {}
