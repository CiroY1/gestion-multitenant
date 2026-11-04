import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CustomerGrid } from './customer-grid'

describe('CustomerGrid', () => {
  let component: CustomerGrid
  let fixture: ComponentFixture<CustomerGrid>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerGrid],
    }).compileComponents()

    fixture = TestBed.createComponent(CustomerGrid)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
