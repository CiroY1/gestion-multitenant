import { Component } from '@angular/core'
import { EventList } from '../../data'

@Component({
  selector: 'social-event',
  standalone: true,
  imports: [],
  templateUrl: './event.html',
  styles: ``,
})
export class Event {
  events = EventList
}
