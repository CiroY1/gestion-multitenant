import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RadialBar } from './radial-bar'

describe('RadialBar', () => {
  let component: RadialBar
  let fixture: ComponentFixture<RadialBar>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadialBar],
    }).compileComponents()

    fixture = TestBed.createComponent(RadialBar)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
