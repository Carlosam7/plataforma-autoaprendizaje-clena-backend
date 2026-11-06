import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configurarApp } from '../../src/configurar-app.js';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../src/modules/auth/application/ports/codigo-verificacion.port.js';
import { ENVIADOR_CODIGO } from '../../src/modules/auth/application/tokens.js';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service.js';

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
    .overrideProvider(ENVIADOR_CODIGO)
    .useValue(buzon)
    .compile();

  const app = modulo.createNestApplication<INestApplication<App>>({
    logger: ['error'],
  });
  configurarApp(app);
  await app.init();
  return { app, buzon, prisma: app.get(PrismaService) };
}

export async function limpiarBaseDatos(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "sesiones", "registros_pendientes", "usuarios" RESTART IDENTITY CASCADE',
  );
}
