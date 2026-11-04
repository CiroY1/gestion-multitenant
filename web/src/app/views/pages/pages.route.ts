import { Route } from '@angular/router'
import { AboutUs } from './about-us/about-us'
import { ContactUs } from './contact-us/contact-us'
import { Faqs } from './faqs/faqs'
import { Pricing } from './pricing/pricing'
import { Profile } from './profile/profile'
import { Team } from './team/team'
import { Timeline } from './timeline/timeline'
import { Welcome } from './welcome/welcome'
import { Error404Alt } from './error-404-alt/error-404-alt'

export const PAGES_ROUTES: Route[] = [
  {
    path: 'welcome',
    component: Welcome,
    data: { title: 'Welcome' },
  },
  {
    path: 'faqs',
    component: Faqs,
    data: { title: 'FAQs' },
  },
  {
    path: 'profile',
    component: Profile,
    data: { title: 'Profile' },
  },

  {
    path: 'contact-us',
    component: ContactUs,
    data: { title: 'Contact Us' },
  },
  {
    path: 'about-us',
    component: AboutUs,
    data: { title: 'About Us' },
  },
  {
    path: 'our-team',
    component: Team,
    data: { title: 'Our Team' },
  },
  {
    path: 'timeline',
    component: Timeline,
    data: { title: 'Timeline' },
  },
  {
    path: 'pricing',
    component: Pricing,
    data: { title: 'Pricing' },
  },
  {
    path: 'error-404-alt',
    component: Error404Alt,
    data: { title: '404' },
  },
]
