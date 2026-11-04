import { Component } from '@angular/core'
import { SkillData } from '../../data'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'profile-skill',
  standalone: true,
  imports: [NgbProgressbarModule, CommonModule],
  templateUrl: './skill.html',
  styles: ``,
})
export class Skill {
  skillData = SkillData
}
