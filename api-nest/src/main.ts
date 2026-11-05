import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Mismo prefijo de rutas que usa el frontend Angular: /api
  app.setGlobalPrefix('api')

  // El frontend corre en 4200 y consume ambos backends.
  app.enableCors({
    origin: ['http://localhost:4200'],
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
