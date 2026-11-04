import { LogoBox } from '@/app/components/logo-box'
import { SocialBtn } from '@/app/components/social-btn/social-btn'
import { login } from '@/app/store/authentication/authentication.actions'
import { Component, inject, type OnInit } from '@angular/core'
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  Validators,
  type UntypedFormGroup,
} from '@angular/forms'
import { RouterModule } from '@angular/router'
import { Store } from '@ngrx/store'

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    SocialBtn,
    LogoBox,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './signin.html',
  styles: ``,
})
export class Signin implements OnInit {
  signInForm!: UntypedFormGroup
  submitted: boolean = false

  public fb = inject(UntypedFormBuilder)
  public store = inject(Store)

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      email: ['admin@demo.com', [Validators.required, Validators.email]],
      password: ['demo1234', [Validators.required]],
    })
  }

  get formValues() {
    return this.signInForm.controls
  }

  login() {
    this.submitted = true
    if (this.signInForm.valid) {
      const email = this.formValues['email'].value // Get the username from the form
      const password = this.formValues['password'].value // Get the password from the form

      // Login Api
      this.store.dispatch(login({ email: email, password: password }))
    }
  }
}
