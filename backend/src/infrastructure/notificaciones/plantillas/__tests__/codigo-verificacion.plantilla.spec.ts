import { describe, expect, it } from 'vitest';
import { MensajeCodigo } from '../../../../application/auth/codigo-verificacion.port.js';
import {
  plantillaCodigoVerificacion,
  smsCodigoVerificacion,
} from '../codigo-verificacion.plantilla.js';

const mensaje: MensajeCodigo = {
  canal: 'CORREO',
  destino: 'carmen@correo.com',
  codigo: '483920',
  proposito: 'REGISTRO',
  vigenciaMinutos: 10,
};

const mensajeSms: MensajeCodigo = {
  canal: 'TELEFONO',
  destino: '+521234567890',
  codigo: '483920',
  proposito: 'REGISTRO',
  vigenciaMinutos: 10,
};

const sms = smsCodigoVerificacion(mensajeSms);
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

describe('smsCodigoVerificacion', () => {
  it('genera un mensaje de texto con el código y la vigencia', () => {
    expect(sms).toContain('483 920');
    expect(sms).toContain('Vence en 10 min.');
  });

  it('advierte que no se debe compartir el código', () => {
    expect(sms).toContain('No lo compartas');
  });

  it('no incluye el telefono del destinatario en el contenido', () => {
    expect(sms).not.toContain(mensajeSms.destino);
  });

  it('cabe en un solo SMS (70 caracteres con tildes)', () => {
    expect(sms.length).toBeLessThanOrEqual(70);
  });
});

describe('plantillaCodigoVerificacion · cambio de contraseña temporal (HU-04)', () => {
  const correoPersonal = plantillaCodigoVerificacion({
    ...mensaje,
    destino: 'luis@clena.example',
    proposito: 'CAMBIO_PASSWORD_INICIAL',
  });

  it('el asunto y el texto dicen que es para cambiar la contraseña temporal', () => {
    expect(correoPersonal.asunto).toBe(
      'Código para cambiar tu contraseña temporal en Kamá',
    );
    expect(correoPersonal.texto).toContain(
      'para cambiar tu contraseña temporal en Kamá',
    );
    expect(correoPersonal.texto).toContain('483 920');
  });
});
