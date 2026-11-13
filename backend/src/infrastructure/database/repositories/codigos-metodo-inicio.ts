import { CodigoInicioSesion } from '../../../domain/auth/codigo-inicio-sesion.js';
import { PrismaService } from '../prisma.service.js';

/*
 * Códigos de un solo uso enviados a un correo o celular de un usuario público (tabla
 * codigo_verificacion). Los usan el inicio de sesión (HU-02) y la eliminación de cuenta
 * (HU-05): lo único que cambia entre los dos es el propósito.
 */
type Proposito = 'INICIO_SESION' | 'ELIMINAR_CUENTA';

/** Último código sin usar de ese contacto y propósito, vencido o no. */
export async function ultimoCodigoSinUsar(
  prisma: PrismaService,
  metodoInicioId: string,
  proposito: Proposito,
): Promise<CodigoInicioSesion | null> {
  const fila = await prisma.codigoVerificacion.findFirst({
    where: { metodoInicioId, proposito, usadoEn: null },
    orderBy: { creadoEn: 'desc' },
  });
  if (!fila) return null;
  return CodigoInicioSesion.reconstituir({
    id: fila.id,
    metodoInicioId,
    codigoHash: fila.codigoHash,
    intentosFallidos: fila.intentos,
    creadoEn: fila.creadoEn,
    expiraEn: fila.expiraEn,
    usadoEn: fila.usadoEn,
  });
}

/** Guarda el código nuevo y anula los anteriores sin usar del mismo propósito. */
export async function emitirCodigo(
  prisma: PrismaService,
  codigo: CodigoInicioSesion,
  proposito: Proposito,
): Promise<void> {
  await prisma.$transaction([
    // Solo vale el último código enviado.
    prisma.codigoVerificacion.updateMany({
      where: {
        metodoInicioId: codigo.metodoInicioId,
        proposito,
        usadoEn: null,
      },
      data: { usadoEn: codigo.creadoEn },
    }),
    prisma.codigoVerificacion.create({
      data: {
        id: codigo.id,
        metodoInicioId: codigo.metodoInicioId,
        proposito,
        codigoHash: codigo.codigoHash,
        intentos: codigo.intentosFallidos,
        expiraEn: codigo.expiraEn,
        creadoEn: codigo.creadoEn,
      },
    }),
  ]);
}

/**
 * Suma un intento al código solo si todavía le quedan. Es una sola operación en la base
 * de datos: con peticiones en paralelo, solo `maxIntentos` la superan.
 */
export async function reservarIntento(
  prisma: PrismaService,
  codigoId: string,
  maxIntentos: number,
): Promise<boolean> {
  const { count } = await prisma.codigoVerificacion.updateMany({
    where: { id: codigoId, usadoEn: null, intentos: { lt: maxIntentos } },
    data: { intentos: { increment: 1 } },
  });
  return count > 0;
}
