import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configurarApp } from '../../src/app.setup.js';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../src/application/auth/codigo-verificacion.port.js';
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

export async function crearApp(): Promise<{
  app: INestApplication<App>;
  buzon: BuzonCodigos;
  prisma: PrismaService;
}> {
  const buzon = new BuzonCodigos();
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EnviadorCodigo)
    .useValue(buzon)
    .compile();

  const app = modulo.createNestApplication<INestApplication<App>>({
    logger: ['error'],
  });
  await configurarApp(app);
  return { app, buzon, prisma: app.get(PrismaService) };
}

/** Borra cuentas y registros; las semillas (aviso, categorías) se conservan. */
export async function limpiarBaseDatos(prisma: PrismaService): Promise<void> {
  // CASCADE arrastra metodo_inicio, consentimiento, codigo_verificacion y refresh_token.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "usuario_publico" CASCADE');
}
