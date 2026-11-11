import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
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
  it('validación: 400 con mensaje sencillo y los detalles de cada campo', () => {
    const { status, cuerpo } = ejecutar(
      new BadRequestException(['pagina must not be less than 1']),
    );
    expect(status).toBe(400);
    expect(cuerpo).toMatchObject({
      statusCode: 400,
      codigo: 'DATOS_INVALIDOS',
      detalles: ['pagina must not be less than 1'],
      ruta: '/api/v1/prueba',
    });
  });

  it('404 con texto simple usa la misma forma', () => {
    const { cuerpo } = ejecutar(new NotFoundException('Cannot GET /x'));
    expect(cuerpo).toMatchObject({
      codigo: 'NO_ENCONTRADO',
      mensaje: 'No encontramos lo que buscas.',
      detalles: ['Cannot GET /x'],
    });
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
