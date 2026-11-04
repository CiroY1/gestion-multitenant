import { Route } from '@angular/router'
import { Signin } from './signin/signin'
import { Signin2 } from './signin2/signin2'
import { Signup } from './signup/signup'
import { Signup2 } from './signup2/signup2'
import { ResetPass } from './reset-pass/reset-pass'
import { ResetPass2 } from './reset-pass2/reset-pass2'
import { LockScreen } from './lock-screen/lock-screen'
import { LockScreen2 } from './lock-screen2/lock-screen2'

export const AUTH_ROUTES: Route[] = [
  {
    path: 'sign-in',
    component: Signin,
    data: { title: 'Sign In' },
  },
  {
    path: 'sign-in-2',
    component: Signin2,
    data: { title: 'Sign In 2' },
  },
  {
    path: 'sign-up',
    component: Signup,
    data: { title: 'Sign Up' },
  },
  {
    path: 'sign-up-2',
    component: Signup2,
    data: { title: 'Sign Up 2' },
  },
  {
    path: 'reset-pass',
    component: ResetPass,
    data: { title: 'Reset Password' },
  },
  {
    path: 'reset-pass-2',
    component: ResetPass2,
    data: { title: 'Reset Password 2' },
  },
  {
    path: 'lock-screen',
    component: LockScreen,
    data: { title: 'Lock Screen' },
  },
  {
    path: 'lock-screen-2',
    component: LockScreen2,
    data: { title: 'Lock Screen 2' },
  },
]
