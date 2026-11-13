import { Injectable } from '@nestjs/common';
import { CodigoInicioSesion } from '../../../domain/auth/codigo-inicio-sesion.js';
import {
  CuentaParaInicio,
  InicioSesionRepository,
} from '../../../domain/auth/inicio-sesion.repository.js';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { NumeroIdentificacion } from '../../../domain/auth/value-objects/numero-identificacion.js';
import { Telefono } from '../../../domain/auth/value-objects/telefono.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';
import {
  emitirCodigo,
  reservarIntento,
  ultimoCodigoSinUsar,
} from './codigos-metodo-inicio.js';

/*
 * El inicio de sesión del usuario público usa las tablas del registro:
 *   metodo_inicio       → el correo o celular con el que entra (su id es la solicitud)
 *   codigo_verificacion → código con propósito INICIO_SESION en ese metodo_inicio
 * Una cuenta está activa cuando al menos uno de sus métodos está verificado.
 */

const PROPOSITO = 'INICIO_SESION';

const DE_CUENTA_ACTIVA = {
  usuario: { metodosInicio: { some: { verificadoEn: { not: null } } } },
} satisfies Prisma.MetodoInicioWhereInput;

const SELECCION = {
  id: true,
  tipo: true,
  valor: true,
  usuario: { select: { numeroIdentificacion: true, nombre: true } },
} satisfies Prisma.MetodoInicioSelect;

type FilaMetodo = Prisma.MetodoInicioGetPayload<{ select: typeof SELECCION }>;

@Injectable()
export class PrismaInicioSesionRepository implements InicioSesionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarCuenta(
    numero: NumeroIdentificacion,
    contacto: Correo | Telefono,
  ): Promise<CuentaParaInicio | null> {
    const fila = await this.prisma.metodoInicio.findFirst({
      where: {
        usuarioId: numero.valor,
        tipo: contacto instanceof Telefono ? 'TELEFONO' : 'CORREO',
        valor: contacto.valor,
        ...DE_CUENTA_ACTIVA,
      },
      select: SELECCION,
    });
    return fila ? aCuenta(fila) : null;
  }

  async buscarCuentaPorContacto(
    metodoInicioId: string,
  ): Promise<CuentaParaInicio | null> {
    const fila = await this.prisma.metodoInicio.findFirst({
      where: { id: metodoInicioId, ...DE_CUENTA_ACTIVA },
      select: SELECCION,
    });
    return fila ? aCuenta(fila) : null;
  }

  ultimoCodigoSinUsar(
    metodoInicioId: string,
  ): Promise<CodigoInicioSesion | null> {
    return ultimoCodigoSinUsar(this.prisma, metodoInicioId, PROPOSITO);
  }

  emitirCodigo(codigo: CodigoInicioSesion): Promise<void> {
    return emitirCodigo(this.prisma, codigo, PROPOSITO);
  }

  reservarIntento(codigoId: string, maxIntentos: number): Promise<boolean> {
    return reservarIntento(this.prisma, codigoId, maxIntentos);
  }

  async confirmar(codigo: CodigoInicioSesion): Promise<void> {
    const ahora = codigo.usadoEn ?? new Date();
    await this.prisma.$transaction([
      this.prisma.codigoVerificacion.update({
        where: { id: codigo.id },
        data: { usadoEn: ahora },
      }),
      this.prisma.metodoInicio.updateMany({
        where: { id: codigo.metodoInicioId, verificadoEn: null },
        data: { verificadoEn: ahora },
      }),
    ]);
  }
}

function aCuenta(fila: FilaMetodo): CuentaParaInicio {
  return {
    usuarioId: fila.usuario.numeroIdentificacion,
    nombre: fila.usuario.nombre,
    metodoInicioId: fila.id,
    canal: fila.tipo,
    destino:
      fila.tipo === 'TELEFONO'
        ? Telefono.crear(fila.valor)
        : Correo.crear(fila.valor),
  };
}
