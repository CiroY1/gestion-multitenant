import { Route } from '@angular/router'
import { Schedule } from './schedule/schedule'
import { Integration } from './integration/integration'
import { CalendarHelp } from './calendar-help/calendar-help'

export const CALENDAR_ROUTES: Route[] = [
  {
    path: 'schedule',
    component: Schedule,
    data: { title: 'Schedule' },
  },
  {
    path: 'integration',
    component: Integration,
    data: { title: 'Integration' },
  },
  {
    path: 'help',
    component: CalendarHelp,
    data: { title: 'Help' },
  },
]
