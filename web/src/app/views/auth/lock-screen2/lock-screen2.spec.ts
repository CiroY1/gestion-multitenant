import { ComponentFixture, TestBed } from '@angular/core/testing'

import { LockScreen2 } from './lock-screen2'

describe('LockScreen2', () => {
  let component: LockScreen2
  let fixture: ComponentFixture<LockScreen2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockScreen2],
    }).compileComponents()

    fixture = TestBed.createComponent(LockScreen2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
