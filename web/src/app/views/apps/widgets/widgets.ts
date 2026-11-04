import { Component } from '@angular/core'
import { Conversation } from './components/conversation/conversation'
import { Performance } from './components/performance/performance'
import { WidgetState2 } from './components/widget-state2/widget-state2'
import { WidgetState3 } from './components/widget-state3/widget-state3'
import { WidgetFriendRequest } from './components/widget-friend-request/widget-friend-request'
import { WidgetTask } from './components/widget-task/widget-task'
import { WidgetTransaction } from './components/widget-transaction/widget-transaction'
import { RecentProject } from './components/recent-project/recent-project'
import { Schedule } from './components/schedule/schedule'
import { PageTitle } from '@/app/components/page-title'
import { StateCard } from '@/app/components/state-card/state-card'

@Component({
  selector: 'app-widgets',
  standalone: true,
  imports: [
    PageTitle,
    Conversation,
    Performance,
    StateCard,
    WidgetState2,
    WidgetState3,
    WidgetFriendRequest,
    WidgetTask,
    WidgetTransaction,
    RecentProject,
    Schedule,
  ],
  templateUrl: './widgets.html',
  styles: ``,
})
export class Widgets {}
