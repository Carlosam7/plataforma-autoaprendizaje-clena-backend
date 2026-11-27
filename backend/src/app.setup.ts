import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { join } from 'node:path';
import { VariablesEntorno } from './infrastructure/config/variables-entorno.js';
import { construirRespuestaError } from './presentation/filters/excepciones.filter.js';
import { crearPipeValidacion } from './presentation/shared/pipe-validacion.js';

export const PREFIJO_API = 'api/v1';

/**
 * Imágenes de las guías (HU-10), servidas en /api/v1/archivos para que pasen por el mismo
 * proxy que la API. shortcut: almacén local con las imágenes de la semilla; con la subida
 * de imágenes (HU-14) se cambia por un proveedor externo y imagen.url apunta a él.
 */
export const DIRECTORIO_ARCHIVOS = join(process.cwd(), 'archivos');

// Configuración HTTP compartida por main.ts y las pruebas e2e, para que los
// tests ejerciten exactamente la misma API que se despliega.
export async function configurarApp(app: INestApplication): Promise<void> {
  const config = app.get<ConfigService<VariablesEntorno, true>>(ConfigService);

  app.setGlobalPrefix(PREFIJO_API);
  // Detrás de Nginx todas las peticiones llegan desde el contenedor del proxy: sin esto el
  // límite de peticiones por IP (ThrottlerGuard) contaría a todo el mundo como una sola IP.
  // Solo se cree X-Forwarded-For si viene de una red privada o local (el proxy de Docker),
  // nunca de una IP pública que podría inventarse el encabezado.
  (app as NestExpressApplication).set(
    'trust proxy',
    'loopback, linklocal, uniquelocal',
  );
  (app as NestExpressApplication).useStaticAssets(DIRECTORIO_ARCHIVOS, {
    prefix: `/${PREFIJO_API}/archivos/`,
    index: false,
  });
  app.useGlobalPipes(crearPipeValidacion());
  // credentials: el navegador solo envía la cookie del refresh token si CORS lo permite.
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });

  // BE-09: en producción no se publica la documentación de la API, salvo SWAGGER_HABILITADO=true.
  if (config.get('SWAGGER_HABILITADO', { infer: true })) {
    const documento = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Kamá — API de autoaprendizaje CLENA')
        .setDescription(
          'API REST de la plataforma de autoaprendizaje digital de la Sala de Internet del CLENA.',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, documento);
  }

  await app.init();
  // Las rutas fuera de /api/v1 no pasan por Nest; sin esto Express responde un 404 en HTML.
  app.use((req: Request, res: Response) => {
    res.status(404).json(construirRespuestaError(404, req.originalUrl));
  });
}
