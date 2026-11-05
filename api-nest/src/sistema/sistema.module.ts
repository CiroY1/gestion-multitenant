import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SistemaController } from './sistema.controller'

@Module({
  imports: [AuthModule],
  controllers: [SistemaController],
})
export class SistemaModule {}
