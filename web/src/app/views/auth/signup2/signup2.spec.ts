import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Signup2 } from './signup2'

describe('Signup2', () => {
  let component: Signup2
  let fixture: ComponentFixture<Signup2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup2],
    }).compileComponents()

    fixture = TestBed.createComponent(Signup2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
