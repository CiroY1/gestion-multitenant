import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { Hero } from './components/hero/hero'
import { Service } from './components/service/service'
import { Team } from './components/team/team'

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [PageTitle, Hero, Service, Team],
  templateUrl: './about-us.html',
  styles: ``,
})
export class AboutUs {}
