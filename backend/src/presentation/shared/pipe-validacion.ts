import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

/**
 * ValidationPipe global: descarta y rechaza propiedades no declaradas en el DTO
 * y responde con el formato uniforme, con los mensajes de cada campo en español.
 */
export function crearPipeValidacion(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: errorDeValidacion,
  });
}

/** El primer mensaje se muestra al usuario; `detalles.campos` le dice al frontend qué marcar. */
export function errorDeValidacion(
  errores: ValidationError[],
): BadRequestException {
  const campos = aplanar(errores);
  const primero = Object.values(campos)[0]?.[0];
  return new BadRequestException({
    codigo: 'DATOS_INVALIDOS',
    mensaje: primero ?? 'Revisa los datos e intenta de nuevo.',
    detalles: { campos },
  });
}

function aplanar(
  errores: ValidationError[],
  prefijo = '',
): Record<string, string[]> {
  const resultado: Record<string, string[]> = {};
  for (const error of errores) {
    const ruta = prefijo ? `${prefijo}.${error.property}` : error.property;
    if (error.constraints) {
      resultado[ruta] = Object.entries(error.constraints).map(
        ([regla, mensaje]) =>
          regla === 'whitelistValidation'
            ? `El campo «${error.property}» no está permitido.`
            : mensaje,
      );
    }
    Object.assign(resultado, aplanar(error.children ?? [], ruta));
  }
  return resultado;
}
