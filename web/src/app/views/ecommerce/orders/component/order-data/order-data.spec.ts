import { ComponentFixture, TestBed } from '@angular/core/testing'

import { OrderData } from './order-data'

describe('OrderData', () => {
  let component: OrderData
  let fixture: ComponentFixture<OrderData>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderData],
    }).compileComponents()

    fixture = TestBed.createComponent(OrderData)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
