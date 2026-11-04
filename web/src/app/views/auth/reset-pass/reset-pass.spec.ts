import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResetPass } from './reset-pass'

describe('ResetPass', () => {
  let component: ResetPass
  let fixture: ComponentFixture<ResetPass>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPass],
    }).compileComponents()

    fixture = TestBed.createComponent(ResetPass)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
