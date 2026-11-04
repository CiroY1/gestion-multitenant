import { ComponentFixture, TestBed } from '@angular/core/testing'

import { GeneralDEtail } from './general-detail'

describe('GeneralDEtail', () => {
  let component: GeneralDEtail
  let fixture: ComponentFixture<GeneralDEtail>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralDEtail],
    }).compileComponents()

    fixture = TestBed.createComponent(GeneralDEtail)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
