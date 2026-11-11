import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configurarApp } from './app.setup.js';

async function bootstrap() {
  // bufferLogs: los logs del arranque esperan a que pino esté listo y salen en JSON.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  await configurarApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

await bootstrap();
