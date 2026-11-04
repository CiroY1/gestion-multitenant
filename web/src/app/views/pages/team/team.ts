import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { TeamList } from './component/team-list/team-list'

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [PageTitle, NgbDropdownModule, TeamList],
  templateUrl: './team.html',
  styles: ``,
})
export class Team {}
