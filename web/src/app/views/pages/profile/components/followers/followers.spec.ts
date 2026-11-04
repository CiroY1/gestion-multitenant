import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Followers } from './followers'

describe('Followers', () => {
  let component: Followers
  let fixture: ComponentFixture<Followers>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Followers],
    }).compileComponents()

    fixture = TestBed.createComponent(Followers)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
