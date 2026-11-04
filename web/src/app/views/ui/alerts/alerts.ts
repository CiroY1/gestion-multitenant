import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap'
import { AlertType, alert } from './data'
import { UIExamplesList } from '@/app/components/ui-examples-list/ui-examples-list'

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [PageTitle, NgbAlertModule, UIExamplesList],
  templateUrl: './alerts.html',
  styles: ``,
})
export class Alerts {
  alertData: AlertType[] = alert

  close(index: number) {
    this.alertData.splice(index, 1)
  }
}
