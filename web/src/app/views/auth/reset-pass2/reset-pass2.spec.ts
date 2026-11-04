import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResetPass2 } from './reset-pass2'

describe('ResetPass2', () => {
  let component: ResetPass2
  let fixture: ComponentFixture<ResetPass2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPass2],
    }).compileComponents()

    fixture = TestBed.createComponent(ResetPass2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
