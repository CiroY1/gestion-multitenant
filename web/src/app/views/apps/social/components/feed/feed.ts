import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FeedData, FriendRequest } from '../../data'
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'social-feed',
  standalone: true,
  imports: [NgbDropdownModule, NgbTooltipModule, RouterLink],
  templateUrl: './feed.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feed {
  feedList = FeedData

  private sanitizer = inject(DomSanitizer)

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }
}
