import { Controller, Get, INestApplication, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { EstadoBaseDatos } from '../../src/application/sistema/estado-base-datos.port.js';
import { AppModule } from '../../src/app.module.js';
import { configurarApp } from '../../src/app.setup.js';
import { Publico } from '../../src/presentation/shared/publico.decorator.js';
import { crearApp } from './app.js';

/** Solo para la prueba: devuelve la IP con la que Express identifica al cliente. */
@Publico()
@Controller('prueba-ip')
class PruebaIpController {
  @Get()
  ip(@Req() req: Request) {
    return { ip: req.ip };
  }
}

describe('BE-09 · Sistema (e2e)', () => {
  describe('con la base de datos disponible', () => {
    let app: INestApplication<App>;
    beforeAll(async () => {
      ({ app } = await crearApp([PruebaIpController]));
    });
    afterAll(async () => {
      await app.close();
    });
    const http = () => request(app.getHttpServer());

    it('GET /health responde 200 y confirma la base de datos', async () => {
      const { body } = await http().get('/api/v1/health').expect(200);
      expect(body).toMatchObject({
        status: 'ok',
        service: 'clena-backend',
        baseDatos: 'ok',
      });
      expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('detrás del proxy toma la IP de X-Forwarded-For (límite de peticiones por persona)', async () => {
      const { body } = await http()
        .get('/api/v1/prueba-ip')
        .set('X-Forwarded-For', '192.168.1.37')
        .expect(200);
      expect(body.ip).toBe('192.168.1.37');
    });

    it('fuera de producción publica Swagger en /docs', async () => {
      const { body } = await http().get('/docs-json').expect(200);
      expect(body.info.title).toBe('Kamá — API de autoaprendizaje CLENA');
    });
  });

  it('sin base de datos GET /health responde 503 y el contenedor queda no sano', async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EstadoBaseDatos)
      .useValue({ disponible: () => Promise.resolve(false) })
      .compile();
    const app = modulo.createNestApplication<INestApplication<App>>({
      logger: ['error'],
    });
    await configurarApp(app);
    try {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(503);
      expect(body).toMatchObject({
        status: 'error',
        baseDatos: 'no_disponible',
      });
    } finally {
      await app.close();
    }
  });
});
