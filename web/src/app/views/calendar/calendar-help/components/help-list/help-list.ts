import { Component } from '@angular/core'
import { HelpData } from '../../data'

@Component({
  selector: 'help-list',
  standalone: true,
  imports: [],
  templateUrl: './help-list.html',
  styles: ``,
})
export class HelpList {
  helpList = HelpData
}
