import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import type { UsuarioJwt } from '../auth/jwt.strategy'

/**
 * Deja pasar solo si la empresa tiene activo el módulo spa (claim modSpa del
 * token). Así cada empresa accede únicamente a los módulos que contrató.
 */
@Injectable()
export class ModSpaGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest()
    const usuario = req.user as UsuarioJwt | undefined
    // El super-admin de plataforma tiene bypass: accede a todo.
    if (usuario?.superAdmin) return true
    if (!usuario?.modSpa) {
      throw new ForbiddenException('La empresa no tiene activo el módulo spa.')
    }
    return true
  }
}
