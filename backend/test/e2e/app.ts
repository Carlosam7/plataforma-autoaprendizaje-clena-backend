import { INestApplication, Type } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configurarApp } from '../../src/app.setup.js';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../src/application/auth/codigo-verificacion.port.js';
import { EmisorSesion } from '../../src/application/auth/emisor-sesion.port.js';
import { Rol } from '../../src/domain/auth/tipos.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

/** Captura los códigos enviados para poder verificarlos en las pruebas. */
export class BuzonCodigos implements EnviadorCodigo {
  mensajes: MensajeCodigo[] = [];

  enviar(mensaje: MensajeCodigo): Promise<void> {
    this.mensajes.push(mensaje);
    return Promise.resolve();
  }

  ultimoPara(destino: string): string {
    const mensaje = this.mensajes.findLast((m) => m.destino === destino);
    if (!mensaje) throw new Error(`No se envió ningún código a ${destino}`);
    return mensaje.codigo;
  }
}

/** `controladores`: rutas extra solo para pruebas (p. ej. para ejercitar los guards). */
export async function crearApp(controladores: Type[] = []): Promise<{
  app: INestApplication<App>;
  buzon: BuzonCodigos;
  prisma: PrismaService;
}> {
  const buzon = new BuzonCodigos();
  const modulo = await Test.createTestingModule({
    imports: [AppModule],
    controllers: controladores,
  })
    .overrideProvider(EnviadorCodigo)
    .useValue(buzon)
    .compile();

  const app = modulo.createNestApplication<INestApplication<App>>({
    logger: ['error'],
  });
  await configurarApp(app);
  return { app, buzon, prisma: app.get(PrismaService) };
}

/** Borra cuentas, guías y registros; el aviso y las categorías semilla se conservan. */
export async function limpiarBaseDatos(prisma: PrismaService): Promise<void> {
  // DELETE y no TRUNCATE: TRUNCATE ... CASCADE recrea los archivos de 21 tablas y en Docker
  // a veces tardaba más de 10 s, lo que hacía fallar el beforeEach. Las llaves ON DELETE
  // CASCADE arrastran metodo_inicio, consentimiento, codigo_verificacion y refresh_token.
  // guia apunta a personal con RESTRICT: se borra antes (arrastra pasos y consultas). Eso
  // incluye las guías semilla; las pruebas crean las suyas.
  // shortcut: actividad, imagen, solicitud_ayuda, pregunta_frecuente y termino_glosario
  // también apuntan a personal con RESTRICT; cuando una prueba los cree, bórralos antes aquí.
  await prisma.$transaction([
    prisma.usuarioPublico.deleteMany(),
    prisma.guia.deleteMany(),
    prisma.personal.deleteMany(),
  ]);
}

/**
 * Crea una cuenta del personal y le abre una sesión, sin pasar por el login (HU-06).
 * Devuelve el id de la cuenta y el access token listo para `Authorization: Bearer`.
 */
export async function sesionPersonal(
  app: INestApplication<App>,
  datos: {
    rol: Exclude<Rol, 'USUARIO_PUBLICO'>;
    correo?: string;
    password?: string;
    debeCambiarPassword?: boolean;
  },
): Promise<{ id: string; token: string }> {
  const prisma = app.get(PrismaService);
  const cuenta = await prisma.personal.create({
    data: {
      nombre: `Persona ${datos.rol.toLowerCase()}`,
      correo:
        datos.correo ??
        `${datos.rol.toLowerCase()}-${Date.now()}@clena.example`,
      // Costo 4: en las pruebas importa la velocidad, no la resistencia a fuerza bruta.
      passwordHash: await bcrypt.hash(datos.password ?? 'Temporal2026', 4),
      rol: datos.rol,
      debeCambiarPassword: datos.debeCambiarPassword ?? false,
    },
  });
  const sesion = await app
    .get(EmisorSesion)
    .iniciar({ id: cuenta.id, rol: datos.rol });
  return { id: cuenta.id, token: sesion.accessToken };
}

/** Usuario público con sesión abierta, para comprobar los 403. */
export async function sesionUsuarioPublico(
  app: INestApplication<App>,
): Promise<string> {
  const prisma = app.get(PrismaService);
  const usuario = await prisma.usuarioPublico.create({
    data: {
      numeroIdentificacion: `9${Date.now()}`.slice(0, 15),
      nombre: 'Rafael Gómez',
      fechaNacimiento: new Date('1968-03-10'),
    },
  });
  const sesion = await app
    .get(EmisorSesion)
    .iniciar({ id: usuario.numeroIdentificacion, rol: 'USUARIO_PUBLICO' });
  return sesion.accessToken;
}

/** La cookie `refresh_token=<valor>` que puso la respuesta, lista para enviarla en `Cookie`. */
export function cookieRefresh(respuesta: {
  headers: Record<string, unknown>;
}): string {
  const cookies =
    (respuesta.headers['set-cookie'] as string[] | undefined) ?? [];
  const cookie = cookies.find((c) => c.startsWith('refresh_token='));
  if (!cookie) throw new Error('La respuesta no puso la cookie refresh_token');
  return cookie.split(';')[0];
}
