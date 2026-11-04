import { ComponentFixture, TestBed } from '@angular/core/testing'

import { InventoryProduct } from './inventory-product'

describe('InventoryProduct', () => {
  let component: InventoryProduct
  let fixture: ComponentFixture<InventoryProduct>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryProduct],
    }).compileComponents()

    fixture = TestBed.createComponent(InventoryProduct)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
