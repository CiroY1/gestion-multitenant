import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Detailcard } from './detailcard'

describe('Detailcard', () => {
  let component: Detailcard
  let fixture: ComponentFixture<Detailcard>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Detailcard],
    }).compileComponents()

    fixture = TestBed.createComponent(Detailcard)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
