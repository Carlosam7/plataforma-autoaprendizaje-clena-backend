import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configurarApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  await configurarApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

await bootstrap();
