import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Signin2 } from './signin2'

describe('Signin2', () => {
  let component: Signin2
  let fixture: ComponentFixture<Signin2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signin2],
    }).compileComponents()

    fixture = TestBed.createComponent(Signin2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
