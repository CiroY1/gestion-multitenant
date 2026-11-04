import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Iconamoon } from './iconamoon'

describe('Iconamoon', () => {
  let component: Iconamoon
  let fixture: ComponentFixture<Iconamoon>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Iconamoon],
    }).compileComponents()

    fixture = TestBed.createComponent(Iconamoon)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
