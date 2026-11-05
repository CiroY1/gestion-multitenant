import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/** Guard que exige un JWT válido (el mismo que emite el backend .NET). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
