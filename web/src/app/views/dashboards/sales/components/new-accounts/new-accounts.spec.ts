import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NewAccounts } from './new-accounts'

describe('NewAccounts', () => {
  let component: NewAccounts
  let fixture: ComponentFixture<NewAccounts>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewAccounts],
    }).compileComponents()

    fixture = TestBed.createComponent(NewAccounts)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
