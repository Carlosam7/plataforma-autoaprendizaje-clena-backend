import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MensajeCodigo } from '../../../application/auth/codigo-verificacion.port.js';
import { EnvioCodigoFallidoError } from '../../../domain/auth/errores.js';
import { TwilioEnviadorSms } from '../twilio-enviador-sms.js';

const mensaje: MensajeCodigo = {
  canal: 'TELEFONO',
  destino: '+521234567890',
  codigo: '483920',
  proposito: 'REGISTRO',
  vigenciaMinutos: 10,
};

const enviador = new TwilioEnviadorSms({
  accountSid: 'AC123',
  authToken: 'token123',
  numeroOrigen: '+521234567891',
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TwilioEnviadorSms', () => {
  it('envía el SMS a la API de Twilio con Basic Auth y los tres campos', async () => {
    const fetchFalso = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 201 }));

    await enviador.enviar(mensaje);

    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe(
      'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json',
    );
    expect(opciones?.headers).toEqual({
      Authorization: `Basic ${Buffer.from('AC123:token123').toString('base64')}`,
    });
    const cuerpo = opciones?.body as URLSearchParams;
    expect(cuerpo.get('To')).toBe('+521234567890');
    expect(cuerpo.get('From')).toBe('+521234567891');
    expect(cuerpo.get('Body')).toContain('483 920');
  });
});

describe('TwilioEnviadorSms errores', () => {
  it('lanza EnvioCodigoFallidoError si fetch lanza error', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fallo de red'));

    await expect(enviador.enviar(mensaje)).rejects.toThrow(
      EnvioCodigoFallidoError,
    );
  });

  it('si Twilio rechaza el SMS, lanza el error amable y no registra el número ni el código', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 21608,
          message: `The number ${mensaje.destino} is unverified`,
        }),
        { status: 400 },
      ),
    );

    await expect(enviador.enviar(mensaje)).rejects.toThrow(
      EnvioCodigoFallidoError,
    );

    const registrado = JSON.stringify(log.mock.calls);
    expect(registrado).toContain('21608');
    expect(registrado).not.toContain(mensaje.destino);
    expect(registrado).not.toContain('483920');
  });
});
