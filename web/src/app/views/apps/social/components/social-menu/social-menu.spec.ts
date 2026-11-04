import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SocialMenu } from './social-menu'

describe('SocialMenu', () => {
  let component: SocialMenu
  let fixture: ComponentFixture<SocialMenu>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialMenu],
    }).compileComponents()

    fixture = TestBed.createComponent(SocialMenu)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
