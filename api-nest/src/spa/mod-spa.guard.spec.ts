import { ForbiddenException } from '@nestjs/common'
import { ModSpaGuard } from './mod-spa.guard'

/** Construye un ExecutionContext falso con el usuario del JWT dado. */
function ctxCon(user: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never
}

describe('ModSpaGuard', () => {
  const guard = new ModSpaGuard()

  it('deja pasar si la empresa tiene el módulo spa', () => {
    expect(guard.canActivate(ctxCon({ modSpa: true, superAdmin: false }))).toBe(true)
  })

  it('deja pasar al super-admin aunque no tenga el módulo (bypass)', () => {
    expect(guard.canActivate(ctxCon({ modSpa: false, superAdmin: true }))).toBe(true)
  })

  it('bloquea si no tiene el módulo ni es super-admin', () => {
    expect(() => guard.canActivate(ctxCon({ modSpa: false, superAdmin: false }))).toThrow(
      ForbiddenException,
    )
  })

  it('bloquea si no hay usuario', () => {
    expect(() => guard.canActivate(ctxCon(undefined))).toThrow(ForbiddenException)
  })
})
