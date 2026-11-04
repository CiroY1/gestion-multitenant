import { ComponentFixture, TestBed } from '@angular/core/testing'

import { FlatPicker } from './flat-picker'

describe('FlatPicker', () => {
  let component: FlatPicker
  let fixture: ComponentFixture<FlatPicker>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlatPicker],
    }).compileComponents()

    fixture = TestBed.createComponent(FlatPicker)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
