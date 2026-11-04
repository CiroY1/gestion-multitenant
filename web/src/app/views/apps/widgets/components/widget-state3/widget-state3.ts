import { Component } from '@angular/core'
import { State2Data } from '../../data'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'widget-state3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-state3.html',
  styles: ``,
})
export class WidgetState3 {
  stateList = State2Data
}
