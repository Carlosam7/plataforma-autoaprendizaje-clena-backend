import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MensajeCodigo } from '../../../application/auth/codigo-verificacion.port.js';
import { EnvioCodigoFallidoError } from '../../../domain/auth/errores.js';
import { TextbeeEnviadorSms } from '../textbee-enviador-sms.js';

const mensaje: MensajeCodigo = {
  canal: 'TELEFONO',
  destino: '+573001234567',
  codigo: '483920',
  proposito: 'REGISTRO',
  vigenciaMinutos: 10,
};

const enviador = new TextbeeEnviadorSms({
  apiKey: 'llave-de-prueba',
  dispositivoId: 'android-1',
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TextbeeEnviadorSms', () => {
  it('pide a textbee enviar el SMS desde el Android con la llave en x-api-key', async () => {
    const fetchFalso = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('{"data":{"success":true}}', { status: 200 }),
      );

    await enviador.enviar(mensaje);

    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe('https://api.textbee.dev/api/v1/gateway/send-sms');
    expect(opciones?.headers).toMatchObject({ 'x-api-key': 'llave-de-prueba' });
    const cuerpo = JSON.parse(opciones?.body as string);
    expect(cuerpo).toMatchObject({
      recipients: ['+573001234567'],
      deviceId: 'android-1',
    });
    expect(cuerpo.message).toContain('483 920');
  });

  it('si textbee rechaza el envío, lanza el error amable sin registrar el número ni el código', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: `Device offline for ${mensaje.destino}` }),
        {
          status: 400,
        },
      ),
    );

    await expect(enviador.enviar(mensaje)).rejects.toThrow(
      EnvioCodigoFallidoError,
    );
    const registrado = JSON.stringify(log.mock.calls);
    expect(registrado).toContain('400');
    expect(registrado).not.toContain(mensaje.destino);
    expect(registrado).not.toContain('483920');
  });

  it('si textbee no responde, lanza el error amable', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new DOMException('timeout', 'TimeoutError'),
    );

    await expect(enviador.enviar(mensaje)).rejects.toThrow(
      EnvioCodigoFallidoError,
    );
  });
});
