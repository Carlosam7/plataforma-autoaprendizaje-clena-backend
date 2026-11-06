import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { crearApp } from './app.js';

describe('GET /health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    ({ app } = await crearApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde ok con la base de datos conectada', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ estado: 'ok', baseDeDatos: 'ok' });
  });
});
