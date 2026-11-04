import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { ProfileInfo } from './components/profile-info/profile-info'
import { PersonalInfo } from './components/personal-info/personal-info'
import { Projects } from './components/projects/projects'
import { Activities } from './components/activities/activities'
import { Skill } from './components/skill/skill'
import { Messages } from './components/messages/messages'
import { Followers } from './components/followers/followers'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    PageTitle,
    ProfileInfo,
    PersonalInfo,
    Projects,
    Activities,
    Skill,
    Messages,
    Followers,
  ],
  templateUrl: './profile.html',
  styles: ``,
})
export class Profile {}
