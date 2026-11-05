import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

/** Marca un handler como restringido a ciertos roles (p. ej. @Roles('admin')). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
