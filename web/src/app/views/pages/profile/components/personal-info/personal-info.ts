import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ProfileInfoData } from '../../data'

@Component({
  selector: 'profile-personal-info',
  standalone: true,
  imports: [],
  templateUrl: './personal-info.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PersonalInfo {
  profileInfo = ProfileInfoData
}
