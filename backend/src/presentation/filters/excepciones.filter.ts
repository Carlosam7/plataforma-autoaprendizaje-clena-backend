import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface RespuestaError {
  statusCode: number;
  codigo: string;
  mensaje: string;
  detalles?: string[];
  ruta: string;
  fecha: string;
}

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
  mensaje: 'Ocurrió un problema. Intenta de nuevo en unos minutos.',
};

export function construirRespuestaError(
  statusCode: number,
  ruta: string,
  detalles?: string[],
): RespuestaError {
  const { codigo, mensaje } =
    ERRORES[statusCode] ??
    (statusCode >= 500
      ? ERROR_INTERNO
      : { codigo: 'SOLICITUD_INVALIDA', mensaje: ERRORES[400].mensaje });
  return {
    statusCode,
    codigo,
    mensaje,
    ...(detalles?.length ? { detalles } : {}),
    ruta,
    fecha: new Date().toISOString(),
  };
}

@Catch()
export class ExcepcionesFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExcepcionesFilter.name);

  catch(error: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (!(error instanceof HttpException)) {
      // El detalle interno (SQL, stack) va al log, nunca al cliente.
      this.logger.error(
        `${req.method} ${req.originalUrl}`,
        error instanceof Error ? error.stack : String(error),
      );
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(construirRespuestaError(500, req.originalUrl));
      return;
    }

    const status = error.getStatus();
    const cuerpo = error.getResponse();
    // ValidationPipe deja un arreglo en `message`; las demás excepciones, un texto.
    const original =
      typeof cuerpo === 'object' && 'message' in cuerpo
        ? cuerpo.message
        : cuerpo;
    const detalles = (Array.isArray(original) ? original : [original]).map(
      String,
    );

    res
      .status(status)
      .json(construirRespuestaError(status, req.originalUrl, detalles));
  }
}
