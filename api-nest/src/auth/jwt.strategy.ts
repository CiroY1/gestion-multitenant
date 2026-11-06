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

/** Lee el JWT de la cookie HttpOnly "access_token" (sin cookie-parser). */
export function cookieExtractor(req: { headers?: { cookie?: string } }): string | null {
  const raw = req?.headers?.cookie
  if (!raw) return null
  const found = raw
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('access_token='))
  return found
    ? decodeURIComponent(found.slice('access_token='.length))
    : null
}

/** Identidad extraída del token (la misma que emite el login del backend .NET). */
export interface UsuarioJwt {
  id: string
  email: string
  tenantId: string
  rol: string
  modInventario: boolean
  modSpa: boolean
  /** Super-admin de plataforma: bypass de módulos/roles. */
  superAdmin: boolean
}

interface JwtPayload {
  sub: string
  email: string
  tenantId: string
  modInventario?: string
  modSpa?: string
  superAdmin?: string
  [key: string]: unknown
}

/**
 * Valida los MISMOS JWT (RS256) que emite el backend .NET, usando solo la llave
 * PÚBLICA RSA (JWT_PUBLIC_KEY_B64). Nest no tiene la privada: puede validar pero
 * no forjar tokens. Un token del login sirve contra ambos backends.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const b64 = process.env.JWT_PUBLIC_KEY_B64
    if (!b64) {
      throw new Error(
        'Falta JWT_PUBLIC_KEY_B64 en el entorno (.env.local de la raíz).',
      )
    }
    const publicKey = Buffer.from(b64, 'base64').toString('utf8')
    super({
      // Primero la cookie HttpOnly; si no, el header Authorization (compatibilidad).
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
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
      superAdmin: payload.superAdmin === '1',
    }
  }
}
