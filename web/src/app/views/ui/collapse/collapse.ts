import { PageTitle } from '@/app/components/page-title'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'
import { Component } from '@angular/core'
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-collapse',
  standalone: true,
  imports: [PageTitle, NgbCollapseModule, UIExamplesList],
  templateUrl: './collapse.html',
  styles: ``,
})
export class Collapse {
  isCollapsed = true
  isHorizontal = true
  isFirstToggle = true
  isSecondToggle = true
}
