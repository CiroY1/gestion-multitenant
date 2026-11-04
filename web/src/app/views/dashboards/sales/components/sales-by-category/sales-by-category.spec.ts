import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SalesByCategory } from './sales-by-category'

describe('SalesByCategory', () => {
  let component: SalesByCategory
  let fixture: ComponentFixture<SalesByCategory>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesByCategory],
    }).compileComponents()

    fixture = TestBed.createComponent(SalesByCategory)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
