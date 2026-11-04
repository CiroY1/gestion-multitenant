import { ComponentFixture, TestBed } from '@angular/core/testing'

import { FriendFeed } from './friend-feed'

describe('FriendFeed', () => {
  let component: FriendFeed
  let fixture: ComponentFixture<FriendFeed>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendFeed],
    }).compileComponents()

    fixture = TestBed.createComponent(FriendFeed)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
