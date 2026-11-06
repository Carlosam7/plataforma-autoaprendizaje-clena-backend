import { INestApplication, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VariablesEntorno } from './config/variables-entorno.js';
import { FiltroErrores } from './shared/presentation/filtro-errores.filter.js';
import { crearPipeValidacion } from './shared/presentation/pipe-validacion.js';

export const PREFIJO_API = 'api/v1';

/** Configuración compartida entre `main.ts` y las pruebas e2e, para probar la app tal como corre. */
export function configurarApp(app: INestApplication): void {
  const config = app.get<ConfigService<VariablesEntorno, true>>(ConfigService);

  app.setGlobalPrefix(PREFIJO_API, {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(crearPipeValidacion());
  app.useGlobalFilters(new FiltroErrores());
  app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }) });

  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Plataforma de autoaprendizaje digital — CLENA')
      .setDescription('API de la Sala de Internet del CLENA')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, documento);
}
