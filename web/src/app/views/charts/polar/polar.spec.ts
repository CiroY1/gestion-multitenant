import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Polar } from './polar'

describe('Polar', () => {
  let component: Polar
  let fixture: ComponentFixture<Polar>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Polar],
    }).compileComponents()

    fixture = TestBed.createComponent(Polar)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
