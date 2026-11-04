import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Sessionbycounty } from './sessionbycounty'

describe('Sessionbycounty', () => {
  let component: Sessionbycounty
  let fixture: ComponentFixture<Sessionbycounty>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sessionbycounty],
    }).compileComponents()

    fixture = TestBed.createComponent(Sessionbycounty)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
