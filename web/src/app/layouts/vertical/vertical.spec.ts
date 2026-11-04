import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Vertical } from './vertical'

describe('Vertical', () => {
  let component: Vertical
  let fixture: ComponentFixture<Vertical>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vertical],
    }).compileComponents()

    fixture = TestBed.createComponent(Vertical)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
