import { PageTitle } from '@/app/components/page-title'
import { Component, type OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Detailcard } from './components/detailcard/detailcard'

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [PageTitle, Detailcard],
  templateUrl: './product-details.html',
  styles: ``,
})
export class ProductDetails implements OnInit {
  productId: any

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.productId = params.get('id')
    })
  }
}
