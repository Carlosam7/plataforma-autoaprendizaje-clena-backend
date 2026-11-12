import { describe, expect, it } from 'vitest';
import { MensajeCodigo } from '../../../../application/auth/codigo-verificacion.port.js';
import { plantillaCodigoVerificacion } from '../codigo-verificacion.plantilla.js';

const mensaje: MensajeCodigo = {
  canal: 'CORREO',
  destino: 'carmen@correo.com',
  codigo: '483920',
  proposito: 'REGISTRO',
  vigenciaMinutos: 10,
};

const correo = plantillaCodigoVerificacion(mensaje);

describe('plantillaCodigoVerificacion', () => {
  it('el asunto dice para qué es el código', () => {
    expect(correo.asunto).toBe(
      'Código de verificación para tu registro en Kamá',
    );
  });

  it('muestra el código en dos grupos para leerlo fácil', () => {
    expect(correo.texto).toContain('483 920');
    expect(correo.html).toContain('483 920');
  });

  it('dice cuánto dura el código', () => {
    expect(correo.texto).toContain('Vence en 10 minutos.');
    expect(correo.html).toContain('Vence en 10 minutos.');
  });

  it('advierte que nadie del CLENA pide el código (anti-phishing)', () => {
    expect(correo.texto).toContain('Nadie del CLENA te va a pedir este código');
    expect(correo.html).toContain('Nadie del CLENA te va a pedir este código');
  });

  it('el HTML es accesible: idioma español y tablas solo de diseño', () => {
    expect(correo.html).toContain('<html lang="es">');
    expect(correo.html).not.toMatch(/<table(?![^>]*role="presentation")/);
  });

  it('no incluye el correo del destinatario en el contenido', () => {
    expect(correo.texto).not.toContain(mensaje.destino);
    expect(correo.html).not.toContain(mensaje.destino);
  });
});
