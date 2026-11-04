import { Component } from '@angular/core'
import { FriendRequest, PendingRequest } from '../../data'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { CommonModule } from '@angular/common'
import { SimplebarAngularModule } from 'simplebar-angular'

@Component({
  selector: 'social-friend-list',
  standalone: true,
  imports: [NgbDropdownModule, CommonModule, SimplebarAngularModule],
  templateUrl: './friend-list.html',
  styles: `
    :host {
      display: contents !important;
    }
  `,
})
export class FriendList {
  pendingRequestList = PendingRequest
  friendRequestList = FriendRequest.slice(0, 5)
}
