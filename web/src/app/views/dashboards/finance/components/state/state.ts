import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { stateData } from '../../data'

@Component({
  selector: 'finance-state',
  standalone: true,
  imports: [],
  templateUrl: './state.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class State {
  stateData = stateData
}
