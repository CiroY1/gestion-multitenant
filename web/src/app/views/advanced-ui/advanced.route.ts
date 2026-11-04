import { Route } from '@angular/router'
import { Ratings } from './ratings/ratings'
import { Sweetalert } from './sweetalert/sweetalert'
import { Swiper } from './swiper/swiper'
import { Scrollbar } from './scrollbar/scrollbar'
import { Toastify } from './toastify/toastify'

export const ADVANCED_ROUTES: Route[] = [
  {
    path: 'ratings',
    component: Ratings,
    data: { title: 'Ratings' },
  },
  {
    path: 'alert',
    component: Sweetalert,
    data: { title: 'Sweet Alert' },
  },
  {
    path: 'swiper',
    component: Swiper,
    data: { title: 'Swiper Slider' },
  },
  {
    path: 'scrollbar',
    component: Scrollbar,
    data: { title: 'Scrollbar' },
  },
  {
    path: 'toastify',
    component: Toastify,
    data: { title: 'Toastify' },
  },
]
