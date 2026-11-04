import { Route } from '@angular/router'
import { Accordions } from './accordions/accordions'
import { Alerts } from './alerts/alerts'
import { Avatars } from './avatars/avatars'
import { Breadcrumb } from './breadcrumb/breadcrumb'
import { Buttons } from './buttons/buttons'
import { Cards } from './cards/cards'
import { Carousel } from './carousel/carousel'
import { Dropdowns } from './dropdowns/dropdowns'
import { ListGroup } from './list-group/list-group'
import { Modals } from './modals/modals'
import { Tabs } from './tabs/tabs'
import { Offcanvas } from './offcanvas/offcanvas'
import { Pagination } from './pagination/pagination'
import { Placeholders } from './placeholders/placeholders'
import { Popovers } from './popovers/popovers'
import { Progress } from './progress/progress'
import { Scrollspy } from './scrollspy/scrollspy'
import { Spinners } from './spinners/spinners'
import { Toasts } from './toasts/toasts'
import { Tooltips } from './tooltips/tooltips'
import { Badges } from './badges/badges'
import { Collapse } from './collapse/collapse'

export const UI_ROUTES: Route[] = [
  {
    path: 'accordions',
    component: Accordions,
    data: { title: 'Accordion' },
  },
  {
    path: 'alerts',
    component: Alerts,
    data: { title: 'Alerts' },
  },
  {
    path: 'avatars',
    component: Avatars,
    data: { title: 'Avatar' },
  },
  {
    path: 'badges',
    component: Badges,
    data: { title: 'Badges' },
  },
  {
    path: 'breadcrumb',
    component: Breadcrumb,
    data: { title: 'Breadcrumb' },
  },
  {
    path: 'buttons',
    component: Buttons,
    data: { title: 'Buttons' },
  },
  {
    path: 'cards',
    component: Cards,
    data: { title: 'Card' },
  },
  {
    path: 'carousel',
    component: Carousel,
    data: { title: 'Carousel' },
  },
  {
    path: 'collapse',
    component: Collapse,
    data: { title: 'Collapse' },
  },
  {
    path: 'dropdowns',
    component: Dropdowns,
    data: { title: 'Dropdown' },
  },
  {
    path: 'list-group',
    component: ListGroup,
    data: { title: 'List Group' },
  },
  {
    path: 'modals',
    component: Modals,
    data: { title: 'Modal' },
  },
  {
    path: 'tabs',
    component: Tabs,
    data: { title: 'Tabs' },
  },
  {
    path: 'offcanvas',
    component: Offcanvas,
    data: { title: 'Offcanvas' },
  },
  {
    path: 'pagination',
    component: Pagination,
    data: { title: 'Pagination' },
  },
  {
    path: 'placeholders',
    component: Placeholders,
    data: { title: 'Placeholders' },
  },
  {
    path: 'popovers',
    component: Popovers,
    data: { title: 'Popovers' },
  },
  {
    path: 'progress',
    component: Progress,
    data: { title: 'Progress' },
  },
  {
    path: 'scrollspy',
    component: Scrollspy,
    data: { title: 'Scrollspy' },
  },
  {
    path: 'spinners',
    component: Spinners,
    data: { title: 'Spinners' },
  },
  {
    path: 'toasts',
    component: Toasts,
    data: { title: 'Toasts' },
  },
  {
    path: 'tooltips',
    component: Tooltips,
    data: { title: 'Tooltips' },
  },
]
