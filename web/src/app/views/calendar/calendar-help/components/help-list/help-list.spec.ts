import { ComponentFixture, TestBed } from '@angular/core/testing'

import { HelpList } from './help-list'

describe('HelpList', () => {
  let component: HelpList
  let fixture: ComponentFixture<HelpList>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpList],
    }).compileComponents()

    fixture = TestBed.createComponent(HelpList)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
