import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { PricingPlans } from './data'

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [PageTitle],
  templateUrl: './pricing.html',
  styles: ``,
})
export class Pricing {
  plans = PricingPlans
}
