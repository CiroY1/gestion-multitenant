import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { LeftTimeline } from './components/left-timeline/left-timeline'
import { TimelineData } from './data'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [PageTitle, LeftTimeline, CommonModule],
  templateUrl: './timeline.html',
  styles: ``,
})
export class Timeline {
  timelineList = TimelineData
}
