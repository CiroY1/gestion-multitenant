import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Mismo prefijo de rutas que usa el frontend Angular: /api
  app.setGlobalPrefix('api')

  // Orígenes permitidos desde variable de entorno (coma-separados).
  // Por defecto, el frontend Angular local. credentials para auth por cookie.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  const port = Number(process.env.NEST_PORT ?? 5046)
  await app.listen(port)

  Logger.log(
    `Segundo backend (NestJS) escuchando en http://localhost:${port}/api`,
    'Bootstrap',
  )
}

void bootstrap()
