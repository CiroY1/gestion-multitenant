import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator'
import type { UsuarioJwt } from './jwt.strategy'

/**
 * Exige que el usuario tenga uno de los roles marcados con @Roles(...).
 * Si el handler no declara roles, deja pasar (no restringe).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required || required.length === 0) return true

    const req = ctx.switchToHttp().getRequest()
    const usuario = req.user as UsuarioJwt | undefined
    if (!usuario || !required.includes(usuario.rol)) {
      throw new ForbiddenException('No tienes permiso para esta acción.')
    }
    return true
  }
}
