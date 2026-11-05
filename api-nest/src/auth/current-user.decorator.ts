import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { UsuarioJwt } from './jwt.strategy'

/** Inyecta la identidad del token en el parámetro de un handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioJwt => {
    const req = ctx.switchToHttp().getRequest()
    return req.user as UsuarioJwt
  },
)
