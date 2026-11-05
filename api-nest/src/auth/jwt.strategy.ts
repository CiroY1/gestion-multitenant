import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

/**
 * .NET firma el rol con ClaimTypes.Role, que se serializa con esta URI larga.
 * Hay que leerlo por esa clave (no por "role").
 */
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

/** Issuer/Audience idénticos a los del JwtService de .NET. */
const ISSUER = 'gestion-api'
const AUDIENCE = 'gestion-clientes'

/** Identidad extraída del token (la misma que emite el login del backend .NET). */
export interface UsuarioJwt {
  id: string
  email: string
  tenantId: string
  rol: string
  modInventario: boolean
  modSpa: boolean
}

interface JwtPayload {
  sub: string
  email: string
  tenantId: string
  modInventario?: string
  modSpa?: string
  [key: string]: unknown
}

/**
 * Valida los MISMOS JWT HS256 que emite el backend .NET, usando el JWT_SECRET
 * compartido. Así un token obtenido en el login sirve contra ambos backends.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('Falta JWT_SECRET en el entorno (.env.local de la raíz).')
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    })
  }

  validate(payload: JwtPayload): UsuarioJwt {
    if (!payload?.tenantId) {
      throw new UnauthorizedException('Token sin tenant.')
    }
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      rol: (payload[ROLE_CLAIM] as string) ?? (payload['role'] as string) ?? '',
      modInventario: payload.modInventario === '1',
      modSpa: payload.modSpa === '1',
    }
  }
}
