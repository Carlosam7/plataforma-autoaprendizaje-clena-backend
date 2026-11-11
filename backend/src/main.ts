import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { construirRespuestaError } from './presentation/filters/excepciones.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CLENA Digital Self-Learning API')
    .setDescription('REST API for the CLENA digital self-learning platform.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.init();
  // Las rutas fuera de /api/v1 no pasan por Nest; sin esto Express responde un 404 en HTML.
  app.use((req: Request, res: Response) => {
    res.status(404).json(construirRespuestaError(404, req.originalUrl));
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

await bootstrap();
