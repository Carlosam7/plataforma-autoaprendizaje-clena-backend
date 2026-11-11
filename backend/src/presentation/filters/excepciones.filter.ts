import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ErrorDeNegocio,
  TipoError,
} from '../../domain/shared/error-de-negocio.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';

export type RespuestaError = RespuestaErrorDto;

// El dominio no conoce HTTP: dice qué tipo de error es y aquí se traduce al estado.
const ESTADO_POR_TIPO: Record<TipoError, HttpStatus> = {
  validacion: HttpStatus.BAD_REQUEST,
  conflicto: HttpStatus.CONFLICT,
  no_encontrado: HttpStatus.NOT_FOUND,
  no_autorizado: HttpStatus.UNAUTHORIZED,
  prohibido: HttpStatus.FORBIDDEN,
  demasiados_intentos: HttpStatus.TOO_MANY_REQUESTS,
  expirado: HttpStatus.GONE,
  servicio_no_disponible: HttpStatus.SERVICE_UNAVAILABLE,
};

// Mensajes para el usuario final: lenguaje sencillo, sin términos técnicos (DoD del backlog).
const ERRORES: Record<number, { codigo: string; mensaje: string }> = {
  400: {
    codigo: 'DATOS_INVALIDOS',
    mensaje: 'Algunos datos no son válidos. Revísalos e intenta de nuevo.',
  },
  401: {
    codigo: 'NO_AUTENTICADO',
    mensaje: 'Necesitas iniciar sesión para continuar.',
  },
  403: {
    codigo: 'SIN_PERMISO',
    mensaje: 'No tienes permiso para hacer esto.',
  },
  404: { codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos lo que buscas.' },
  409: {
    codigo: 'CONFLICTO',
    mensaje: 'Esta información ya existe o cambió hace un momento.',
  },
  429: {
    codigo: 'DEMASIADAS_SOLICITUDES',
    mensaje: 'Hiciste muchas solicitudes seguidas. Espera un momento.',
  },
};

const ERROR_INTERNO = {
  codigo: 'ERROR_INTERNO',
  mensaje:
    'Algo salió mal de nuestro lado. Intenta de nuevo o pide ayuda a un monitor.',
};

/** Cuerpo de las HttpException que ya traen el formato propio (p. ej. el ValidationPipe). */
interface CuerpoPropio {
  codigo: string;
  mensaje: string;
  detalles?: Record<string, unknown>;
}

export function construirRespuestaError(
  statusCode: number,
  ruta: string,
  propio?: CuerpoPropio,
): RespuestaError {
  const { codigo, mensaje, detalles }: CuerpoPropio =
    propio ??
    ERRORES[statusCode] ??
    (statusCode >= 500
      ? ERROR_INTERNO
      : { codigo: 'SOLICITUD_INVALIDA', mensaje: ERRORES[400].mensaje });
  return {
    statusCode,
    codigo,
    mensaje,
    ...(detalles ? { detalles } : {}),
    ruta,
    fecha: new Date().toISOString(),
  };
}

/** Único filtro global: toda respuesta de error tiene la misma forma. */
@Catch()
export class ExcepcionesFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExcepcionesFilter.name);

  catch(error: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const ruta = req.originalUrl;

    if (error instanceof ErrorDeNegocio) {
      const status = ESTADO_POR_TIPO[error.tipo];
      res.status(status).json(
        construirRespuestaError(status, ruta, {
          codigo: error.codigo,
          mensaje: error.message,
          detalles: error.detalles,
        }),
      );
      return;
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      const cuerpo = error.getResponse();
      res
        .status(status)
        .json(
          construirRespuestaError(
            status,
            ruta,
            esCuerpoPropio(cuerpo) ? cuerpo : undefined,
          ),
        );
      return;
    }

    // El detalle interno (SQL, stack) va al log, nunca al cliente.
    this.logger.error(
      `${req.method} ${ruta}`,
      error instanceof Error ? error.stack : String(error),
    );
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(construirRespuestaError(500, ruta));
  }
}

function esCuerpoPropio(cuerpo: unknown): cuerpo is CuerpoPropio {
  return (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    typeof (cuerpo as CuerpoPropio).codigo === 'string' &&
    typeof (cuerpo as CuerpoPropio).mensaje === 'string'
  );
}
