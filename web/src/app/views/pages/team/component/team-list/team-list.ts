import { Component } from '@angular/core'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { OurTeamData } from '../../data'

@Component({
  selector: 'team-list',
  standalone: true,
  imports: [NgbTooltipModule],
  templateUrl: './team-list.html',
  styles: ``,
})
export class TeamList {
  ourTeamList = OurTeamData
}
