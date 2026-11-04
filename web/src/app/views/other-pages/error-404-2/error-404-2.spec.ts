import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Error4042 } from './error-404-2'

describe('Error4042', () => {
  let component: Error4042
  let fixture: ComponentFixture<Error4042>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Error4042],
    }).compileComponents()

    fixture = TestBed.createComponent(Error4042)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
