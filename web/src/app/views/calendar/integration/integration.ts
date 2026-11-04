import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { IntegrationData } from './data'

@Component({
  selector: 'app-integration',
  standalone: true,
  imports: [PageTitle],
  templateUrl: './integration.html',
  styles: ``,
})
export class Integration {
  integrationList = IntegrationData
}
