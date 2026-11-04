import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { Search } from './components/search/search'
import { HelpList } from './components/help-list/help-list'
import { Questions } from './components/questions/questions'

@Component({
  selector: 'app-calendar-help',
  standalone: true,
  imports: [
    PageTitle,
    Search,
    HelpList,
    Questions,
  ],
  templateUrl: './calendar-help.html',
  styles: ``,
})
export class CalendarHelp {}
