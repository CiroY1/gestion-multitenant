import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Finish } from './finish'

describe('Finish', () => {
  let component: Finish
  let fixture: ComponentFixture<Finish>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Finish],
    }).compileComponents()

    fixture = TestBed.createComponent(Finish)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
