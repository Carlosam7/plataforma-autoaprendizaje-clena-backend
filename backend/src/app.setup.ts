import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { construirRespuestaError } from './presentation/filters/excepciones.filter.js';

// Configuración HTTP compartida por main.ts y las pruebas e2e, para que los
// tests ejerciten exactamente la misma API que se despliega.
export async function configurarApp(app: INestApplication): Promise<void> {
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kamá — API de autoaprendizaje CLENA')
    .setDescription(
      'API REST de la plataforma de autoaprendizaje digital de la Sala de Internet del CLENA.',
    )
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.init();
  // Las rutas fuera de /api/v1 no pasan por Nest; sin esto Express responde un 404 en HTML.
  app.use((req: Request, res: Response) => {
    res.status(404).json(construirRespuestaError(404, req.originalUrl));
  });
}
