import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Swiper } from './swiper'

describe('Swiper', () => {
  let component: Swiper
  let fixture: ComponentFixture<Swiper>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Swiper],
    }).compileComponents()

    fixture = TestBed.createComponent(Swiper)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
