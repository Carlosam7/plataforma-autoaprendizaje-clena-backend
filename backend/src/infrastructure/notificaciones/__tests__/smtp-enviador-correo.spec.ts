import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { EnvioCodigoFallidoError } from '../../../domain/auth/errores.js';
import { SmtpEnviadorCorreo } from '../smtp-enviador-correo.js';

describe('SmtpEnviadorCorreo', () => {
  it('si el servidor SMTP no responde, lanza el error amable y no registra el código ni el correo', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    // Puerto 1 en la propia máquina: no hay ningún servidor, la conexión falla enseguida.
    const enviador = new SmtpEnviadorCorreo({
      host: '127.0.0.1',
      puerto: 1,
      usuario: 'u',
      clave: 'c',
      remitente: 'Kamá <prueba@kama.local>',
    });

    await expect(
      enviador.enviar({
        canal: 'CORREO',
        destino: 'carmen@correo.com',
        codigo: '483920',
        proposito: 'REGISTRO',
        vigenciaMinutos: 10,
      }),
    ).rejects.toThrow(EnvioCodigoFallidoError);

    const registrado = JSON.stringify(log.mock.calls);
    expect(registrado).not.toContain('483920');
    expect(registrado).not.toContain('carmen@correo.com');
  }, 15_000);
});
