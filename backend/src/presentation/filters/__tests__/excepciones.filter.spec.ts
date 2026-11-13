import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TelefonoEnUsoError } from '../../../domain/auth/errores.js';
import { errorDeValidacion } from '../../shared/pipe-validacion.js';
import { ExcepcionesFilter } from '../excepciones.filter.js';

function ejecutar(error: unknown) {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/prueba' }),
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
  new ExcepcionesFilter().catch(error, host);
  return {
    status: res.status.mock.calls[0][0] as number,
    cuerpo: res.json.mock.calls[0][0] as Record<string, unknown>,
  };
}

describe('ExcepcionesFilter', () => {
  it('validación: 400 con el primer mensaje y los mensajes de cada campo', () => {
    const errorPipe = errorDeValidacion([
      {
        property: 'limite',
        constraints: { max: 'El límite puede ser máximo 100.' },
        children: [],
      },
    ]);
    const { status, cuerpo } = ejecutar(errorPipe);
    expect(status).toBe(400);
    expect(cuerpo).toMatchObject({
      statusCode: 400,
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'El límite puede ser máximo 100.',
      detalles: { campos: { limite: ['El límite puede ser máximo 100.'] } },
      ruta: '/api/v1/prueba',
    });
  });

  it('error de negocio: el tipo define el estado y el mensaje se muestra tal cual', () => {
    const { status, cuerpo } = ejecutar(new TelefonoEnUsoError());
    expect(status).toBe(409);
    expect(cuerpo).toMatchObject({
      codigo: 'TELEFONO_EN_USO',
      mensaje: 'Ese teléfono ya está en uso, prueba con otro',
    });
  });

  it('una HttpException del framework usa el mensaje sencillo de su estado', () => {
    const { cuerpo } = ejecutar(new NotFoundException('Cannot GET /x'));
    expect(cuerpo).toMatchObject({
      codigo: 'NO_ENCONTRADO',
      mensaje: 'No encontramos lo que buscas.',
    });
    expect(JSON.stringify(cuerpo)).not.toContain('Cannot GET');
  });

  it('error inesperado: 500 sin filtrar el detalle interno al cliente', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const { status, cuerpo } = ejecutar(
      new Error('relation "guia" does not exist'),
    );
    expect(status).toBe(500);
    expect(cuerpo.codigo).toBe('ERROR_INTERNO');
    expect(JSON.stringify(cuerpo)).not.toContain('relation');
  });
});
