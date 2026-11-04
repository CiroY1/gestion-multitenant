import { LogoBox } from '@/app/components/logo-box'
import { SocialBtn } from '@/app/components/social-btn/social-btn'
import { AuthenticationService } from '@/app/core/services/auth.service'
import { Component, inject, signal, type OnInit } from '@angular/core'
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  Validators,
  type UntypedFormGroup,
} from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [SocialBtn, LogoBox, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signin.html',
  styles: ``,
})
export class Signin implements OnInit {
  signInForm!: UntypedFormGroup
  submitted = false
  cargando = signal(false)
  error = signal<string | null>(null)

  public fb = inject(UntypedFormBuilder)
  private auth = inject(AuthenticationService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

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
    this.error.set(null)
    if (this.signInForm.invalid) return

    this.cargando.set(true)
    const { email, password } = this.signInForm.value
    this.auth.login(email, password).subscribe({
      next: () => {
        this.cargando.set(false)
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/'
        this.router.navigateByUrl(returnUrl)
      },
      error: () => {
        this.cargando.set(false)
        this.error.set('Correo o contraseña incorrectos.')
      },
    })
  }
}
