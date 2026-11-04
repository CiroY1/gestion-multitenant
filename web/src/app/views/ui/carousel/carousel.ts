import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  NgbCarouselConfig,
  NgbCarouselModule,
} from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [
    PageTitle,
    NgbCarouselModule,
    UIExamplesList,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './carousel.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Carousel {
  show = true
  show1 = true
  show2 = true

  curentsection: string = 'slides-only'
  showNavigationArrows = false
  showNavigationIndicators = false

  constructor(config: NgbCarouselConfig) {
    config.showNavigationArrows = true
    config.showNavigationIndicators = true
  }
}
