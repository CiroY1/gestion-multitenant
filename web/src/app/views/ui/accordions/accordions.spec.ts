import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Accordions } from './accordions'

describe('Accordions', () => {
  let component: Accordions
  let fixture: ComponentFixture<Accordions>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Accordions],
    }).compileComponents()

    fixture = TestBed.createComponent(Accordions)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
