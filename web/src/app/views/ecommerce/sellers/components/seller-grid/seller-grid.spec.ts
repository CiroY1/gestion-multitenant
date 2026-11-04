import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SellerGrid } from './seller-grid'

describe('SellerGrid', () => {
  let component: SellerGrid
  let fixture: ComponentFixture<SellerGrid>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerGrid],
    }).compileComponents()

    fixture = TestBed.createComponent(SellerGrid)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
