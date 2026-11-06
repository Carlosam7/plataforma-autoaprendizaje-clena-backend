import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorDeNegocio, TipoError } from '../domain/error-de-negocio.js';
import { RespuestaErrorDto } from './respuesta-error.js';

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

// Mensajes en lenguaje sencillo para los errores HTTP que lanza el framework.
const MENSAJE_POR_ESTADO: Partial<
  Record<number, { codigo: string; mensaje: string }>
> = {
  400: {
    codigo: 'SOLICITUD_INVALIDA',
    mensaje: 'Revisa los datos e intenta de nuevo.',
  },
  401: {
    codigo: 'NO_AUTENTICADO',
    mensaje: 'Necesitas iniciar sesión para continuar.',
  },
  403: { codigo: 'SIN_PERMISO', mensaje: 'No tienes permiso para hacer esto.' },
  404: { codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos lo que buscas.' },
  429: {
    codigo: 'DEMASIADAS_SOLICITUDES',
    mensaje: 'Hiciste muchos intentos seguidos. Espera un momento.',
  },
};

const ERROR_INESPERADO = {
  codigo: 'ERROR_INTERNO',
  mensaje:
    'Algo salió mal de nuestro lado. Intenta de nuevo o pide ayuda a un monitor.',
};

/** Cuerpo de las `HttpException` que la API lanza con el formato propio (por ejemplo, desde el ValidationPipe). */
interface CuerpoErrorPropio {
  codigo: string;
  mensaje: string;
  detalles?: Record<string, unknown>;
}

@Catch()
export class FiltroErrores implements ExceptionFilter {
  private readonly logger = new Logger(FiltroErrores.name);

  catch(error: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { statusCode, codigo, mensaje, detalles } = this.traducir(error);
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        error instanceof Error ? error.stack : error,
      );
    }

    const cuerpo: RespuestaErrorDto = {
      statusCode,
      codigo,
      mensaje,
      ...(detalles ? { detalles } : {}),
      ruta: request.originalUrl,
      fecha: new Date().toISOString(),
    };
    response.status(statusCode).json(cuerpo);
  }

  private traducir(error: unknown): Omit<RespuestaErrorDto, 'ruta' | 'fecha'> {
    if (error instanceof ErrorDeNegocio) {
      return {
        statusCode: ESTADO_POR_TIPO[error.tipo],
        codigo: error.codigo,
        mensaje: error.message,
        detalles: error.detalles,
      };
    }

    if (error instanceof HttpException) {
      const statusCode = error.getStatus();
      const cuerpo = error.getResponse();
      if (esCuerpoPropio(cuerpo)) return { statusCode, ...cuerpo };
      const conocido = MENSAJE_POR_ESTADO[statusCode] ?? ERROR_INESPERADO;
      return { statusCode, ...conocido };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      ...ERROR_INESPERADO,
    };
  }
}

function esCuerpoPropio(cuerpo: unknown): cuerpo is CuerpoErrorPropio {
  return (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    typeof (cuerpo as CuerpoErrorPropio).codigo === 'string' &&
    typeof (cuerpo as CuerpoErrorPropio).mensaje === 'string'
  );
}
