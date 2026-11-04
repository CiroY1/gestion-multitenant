import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RevenueSources } from './revenue-sources'

describe('RevenueSources', () => {
  let component: RevenueSources
  let fixture: ComponentFixture<RevenueSources>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueSources],
    }).compileComponents()

    fixture = TestBed.createComponent(RevenueSources)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
