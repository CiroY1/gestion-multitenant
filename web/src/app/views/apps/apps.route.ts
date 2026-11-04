import { Route } from '@angular/router'
import { Chat } from './chat/chat'
import { Contacts } from './contacts/contacts'
import { Email } from './email/email'
import { Social } from './social/social'
import { Todo } from './todo/todo'

export const APPS_ROUTES: Route[] = [
  {
    path: 'chat',
    component: Chat,
    data: { title: 'Chat' },
  },
  {
    path: 'email',
    component: Email,
    data: { title: 'Email' },
  },
  {
    path: 'todo',
    component: Todo,
    data: { title: 'To do' },
  },
  {
    path: 'social',
    component: Social,
    data: { title: 'Social' },
  },
  {
    path: 'contacts',
    component: Contacts,
    data: { title: 'Contacts' },
  },
]
