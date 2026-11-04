import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FollowersData } from '../../data'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'profile-followers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './followers.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Followers {
  followerList = FollowersData
}
