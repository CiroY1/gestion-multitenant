import { Component } from '@angular/core'
import { MessagesData } from '../../data'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'profile-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages.html',
  styles: ``,
})
export class Messages {
  messageList = MessagesData
}
