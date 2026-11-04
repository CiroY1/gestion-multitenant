import { Component } from '@angular/core'
import { ServiceData } from '../../data'

@Component({
  selector: 'about-service',
  standalone: true,
  imports: [],
  templateUrl: './service.html',
  styles: ``,
})
export class Service {
  serviceList = ServiceData
}
