import { Component } from '@angular/core'
import { Contacts } from './components/contacts/contacts'
import { ChatList } from './components/chat-list/chat-list'
import type { ContactType, GroupType, UserContactType } from './data'

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [Contacts, ChatList],
  templateUrl: './chat.html',
  styles: ``,
})
export class Chat {
  profileDetail!: ContactType | GroupType | UserContactType

  receiveDataFromChild(data: ContactType | GroupType | UserContactType) {
    this.profileDetail = data
  }
}
