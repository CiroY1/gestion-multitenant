import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CalendarHelp } from './calendar-help'

describe('CalendarHelp', () => {
  let component: CalendarHelp
  let fixture: ComponentFixture<CalendarHelp>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarHelp],
    }).compileComponents()

    fixture = TestBed.createComponent(CalendarHelp)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
