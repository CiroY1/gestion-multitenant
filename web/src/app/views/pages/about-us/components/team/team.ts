import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { TeamData } from '../../data'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'about-team',
  standalone: true,
  imports: [NgbTooltipModule, RouterLink],
  templateUrl: './team.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Team {
  teamList = TeamData
}
