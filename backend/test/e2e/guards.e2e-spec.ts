import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import type { UsuarioAutenticado } from '../../src/application/auth/validar-sesion.use-case.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { Roles } from '../../src/presentation/shared/roles.decorator.js';
import { UsuarioActual } from '../../src/presentation/shared/usuario-actual.decorator.js';
import {
  crearApp,
  limpiarBaseDatos,
  sesionPersonal,
  sesionUsuarioPublico,
} from './app.js';

/** Rutas que solo existen en esta prueba: una para cualquier sesión y otra solo para administradores. */
@Controller('prueba-guards')
class RutasDePruebaController {
  @Get('autenticada')
  autenticada(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }

  @Roles('ADMINISTRADOR')
  @Get('administrador')
  administrador() {
    return { ok: true };
  }
}

const AUTENTICADA = '/api/v1/prueba-guards/autenticada';
const ADMINISTRADOR = '/api/v1/prueba-guards/administrador';

describe('Guards de JWT y roles (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await crearApp([RutasDePruebaController]));
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const conToken = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('las rutas @Publico() siguen abiertas sin token', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    await request(app.getHttpServer()).get('/api/v1/categorias').expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/aviso-privacidad/vigente')
      .expect(200);
  });

  it('una ruta protegida responde 401 sin token, con un mensaje sencillo', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(AUTENTICADA)
      .expect(401);
    expect(respuesta.body).toMatchObject({
      statusCode: 401,
      codigo: 'NO_AUTENTICADO',
      mensaje: 'Necesitas iniciar sesión para continuar.',
    });
  });

  it.each([
    ['token mal formado', 'Bearer no-es-un-jwt'],
    [
      'firma de otro secreto',
      'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzaWQiOiJ4Iiwicm9sIjoiQURNSU5JU1RSQURPUiJ9.firma',
    ],
    ['esquema distinto de Bearer', 'Basic dXNlcjpwYXNz'],
  ])('responde 401 con %s', async (_caso, cabecera) => {
    await request(app.getHttpServer())
      .get(AUTENTICADA)
      .set('Authorization', cabecera)
      .expect(401);
  });

  it('con una sesión válida deja pasar y entrega el usuario al controlador', async () => {
    const { id, token } = await sesionPersonal(app, { rol: 'PERSONAL' });
    const { body } = await request(app.getHttpServer())
      .get(AUTENTICADA)
      .set(conToken(token))
      .expect(200);
    expect(body).toMatchObject({ id, rol: 'PERSONAL' });
  });

  it('responde 403 a un usuario público en una ruta de administrador', async () => {
    const token = await sesionUsuarioPublico(app);
    await request(app.getHttpServer())
      .get(AUTENTICADA)
      .set(conToken(token))
      .expect(200);
    const respuesta = await request(app.getHttpServer())
      .get(ADMINISTRADOR)
      .set(conToken(token))
      .expect(403);
    expect(respuesta.body.codigo).toBe('SIN_PERMISO');
  });

  it('responde 403 al personal sin rol de administrador y 200 al administrador', async () => {
    const monitor = await sesionPersonal(app, { rol: 'PERSONAL' });
    await request(app.getHttpServer())
      .get(ADMINISTRADOR)
      .set(conToken(monitor.token))
      .expect(403);
    const admin = await sesionPersonal(app, { rol: 'ADMINISTRADOR' });
    await request(app.getHttpServer())
      .get(ADMINISTRADOR)
      .set(conToken(admin.token))
      .expect(200);
  });

  it('un token deja de servir cuando su sesión se revoca', async () => {
    const { id, token } = await sesionPersonal(app, { rol: 'PERSONAL' });
    await prisma.refreshToken.updateMany({
      where: { personalId: id },
      data: { revocadoEn: new Date() },
    });
    const respuesta = await request(app.getHttpServer())
      .get(AUTENTICADA)
      .set(conToken(token))
      .expect(401);
    expect(respuesta.body.codigo).toBe('SESION_INVALIDA');
  });

  it('un token deja de servir cuando la cuenta del personal se desactiva', async () => {
    const { id, token } = await sesionPersonal(app, { rol: 'PERSONAL' });
    await prisma.personal.update({ where: { id }, data: { activo: false } });
    await request(app.getHttpServer())
      .get(AUTENTICADA)
      .set(conToken(token))
      .expect(401);
  });

  it('el rol se toma de la base de datos: quitarle el rol de administrador aplica de inmediato', async () => {
    const { id, token } = await sesionPersonal(app, { rol: 'ADMINISTRADOR' });
    await prisma.personal.update({ where: { id }, data: { rol: 'PERSONAL' } });
    await request(app.getHttpServer())
      .get(ADMINISTRADOR)
      .set(conToken(token))
      .expect(403);
  });
});
