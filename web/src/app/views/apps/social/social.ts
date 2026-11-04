import { PageTitle } from '@/app/components/page-title'
import { Component, inject, Input, type OnInit } from '@angular/core'
import { NgbNavModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'
import { Event } from './components/event/event'
import { Feed } from './components/feed/feed'
import { FriendFeed } from './components/friend-feed/friend-feed'
import { FriendList } from './components/friend-list/friend-list'
import { Groups } from './components/groups/groups'
import { Memories } from './components/memories/memories'
import { Saved } from './components/saved/saved'
import { SocialMenu } from './components/social-menu/social-menu'
import { SharedService } from './shared.service'

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [
    PageTitle,
    Feed,
    FriendList,
    NgbNavModule,
    FriendFeed,
    Event,
    Groups,
    Saved,
    Memories,
    SimplebarAngularModule,
    SocialMenu,
  ],
  templateUrl: './social.html',
  styles: ``,
})
export class Social implements OnInit {
  activeTab: string = 'feed'

  public offcanvasService = inject(NgbOffcanvas)
  public sharedService = inject(SharedService)

  ngOnInit() {
    this.sharedService.activeTab$.subscribe((tab) => {
      this.activeTab = tab
    })
  }

  openMenuOffcanvas() {
    this.offcanvasService.open(SocialMenu)
  }

  openFriendOffcanvas() {
    this.offcanvasService.open(FriendList, { position: 'end' })
  }

  changeTab(tab: string) {
    this.sharedService.setActiveTab(tab)
  }
}
