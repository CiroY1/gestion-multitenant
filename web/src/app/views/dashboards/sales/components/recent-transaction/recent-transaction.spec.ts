import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RecentTransaction } from './recent-transaction'

describe('RecentTransaction', () => {
  let component: RecentTransaction
  let fixture: ComponentFixture<RecentTransaction>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTransaction],
    }).compileComponents()

    fixture = TestBed.createComponent(RecentTransaction)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
