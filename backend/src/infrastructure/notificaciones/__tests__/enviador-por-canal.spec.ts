import { describe, expect, it } from 'vitest';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../../application/auth/codigo-verificacion.port.js';
import { EnviadorPorCanal } from '../enviador-por-canal.js';

class EnviadorEspia implements EnviadorCodigo {
  recibidos: MensajeCodigo[] = [];
  enviar(mensaje: MensajeCodigo): Promise<void> {
    this.recibidos.push(mensaje);
    return Promise.resolve();
  }
}

function mensaje(canal: MensajeCodigo['canal']): MensajeCodigo {
  return {
    canal,
    destino: canal === 'CORREO' ? 'carmen@correo.com' : '+573001234567',
    codigo: '483920',
    proposito: 'REGISTRO',
    vigenciaMinutos: 10,
  };
}

describe('EnviadorPorCanal', () => {
  it('manda cada mensaje solo al enviador de su canal', async () => {
    const correo = new EnviadorEspia();
    const sms = new EnviadorEspia();
    const enviador = new EnviadorPorCanal({ CORREO: correo, TELEFONO: sms });

    await enviador.enviar(mensaje('CORREO'));
    await enviador.enviar(mensaje('TELEFONO'));

    expect(correo.recibidos.map((m) => m.canal)).toEqual(['CORREO']);
    expect(sms.recibidos.map((m) => m.canal)).toEqual(['TELEFONO']);
  });

  it('si el enviador del canal falla, el error llega intacto', async () => {
    const roto: EnviadorCodigo = {
      enviar: () => Promise.reject(new Error('sin conexión')),
    };
    const enviador = new EnviadorPorCanal({
      CORREO: roto,
      TELEFONO: new EnviadorEspia(),
    });

    await expect(enviador.enviar(mensaje('CORREO'))).rejects.toThrow(
      'sin conexión',
    );
  });
});
