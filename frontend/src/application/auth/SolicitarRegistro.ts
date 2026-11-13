import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type { CodigoEnviado, SolicitudRegistro } from '@/domain/auth/types';

const SEPARADORES_DOC = /[\s.-]/g;
const FORMATO_DOC = /^[A-Z0-9]{4,15}$/;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const SEPARADORES_TEL = /[\s\-().]/g;
const FORMATO_CELULAR_COLOMBIA = /^3\d{9}$/;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EDAD_MAXIMA = 120;

export class SolicitarRegistro {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(solicitud: SolicitudRegistro): Promise<CodigoEnviado> {
    // 1. Validar nombre
    const nombre = solicitud.nombre?.trim();
    if (!nombre || nombre.length < 2 || nombre.length > 100) {
      throw new AuthValidationError(
        'Escribe tu nombre, entre 2 y 100 letras.',
        'nombre',
      );
    }

    // 2. Validar número de identificación (cédula, extranjería, pasaporte)
    const docLimpio = solicitud.numeroIdentificacion
      ?.trim()
      .replace(SEPARADORES_DOC, '')
      .toUpperCase();

    if (!docLimpio || !FORMATO_DOC.test(docLimpio)) {
      throw new AuthValidationError(
        'Escribe tu número de identificación sin puntos ni espacios, entre 4 y 15 caracteres.',
        'numeroIdentificacion',
      );
    }

    // 3. Validar fecha de nacimiento (AAAA-MM-DD)
    const fechaTexto = solicitud.fechaNacimiento?.trim() || '';
    const partesFecha = FORMATO_FECHA.exec(fechaTexto);
    if (!partesFecha) {
      throw new AuthValidationError(
        'Escribe tu fecha de nacimiento con el formato año-mes-día, por ejemplo 1955-08-21.',
        'fechaNacimiento',
      );
    }

    const [anio, mes, dia] = partesFecha.slice(1).map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (
      fecha.getUTCFullYear() !== anio ||
      fecha.getUTCMonth() !== mes - 1 ||
      fecha.getUTCDate() !== dia
    ) {
      throw new AuthValidationError(
        'Escribe tu fecha de nacimiento con el formato año-mes-día, por ejemplo 1955-08-21.',
        'fechaNacimiento',
      );
    }

    const ahora = new Date();
    const hoyUtc = Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate(),
    );
    if (fecha.getTime() > hoyUtc) {
      throw new AuthValidationError(
        'La fecha de nacimiento no puede ser posterior a hoy.',
        'fechaNacimiento',
      );
    }
    if (ahora.getUTCFullYear() - anio > EDAD_MAXIMA) {
      throw new AuthValidationError(
        'Revisa el año de tu fecha de nacimiento.',
        'fechaNacimiento',
      );
    }

    // 4. Validar medios de contacto (al menos uno: correo o celular)
    const correoLimpio = solicitud.correo?.trim().toLowerCase();
    const tieneCorreo = Boolean(correoLimpio);

    let celularLimpio: string | undefined = undefined;
    if (solicitud.telefono?.trim()) {
      let digitos = solicitud.telefono.trim().replace(SEPARADORES_TEL, '');
      if (digitos.startsWith('+57')) digitos = digitos.slice(3);
      else if (digitos.startsWith('57') && digitos.length === 12) {
        digitos = digitos.slice(2);
      }
      if (!FORMATO_CELULAR_COLOMBIA.test(digitos)) {
        throw new AuthValidationError(
          'Escribe un número de celular de 10 dígitos, por ejemplo 300 123 4567.',
          'telefono',
        );
      }
      celularLimpio = digitos; // Enviamos los 10 dígitos al backend
    }

    if (!tieneCorreo && !celularLimpio) {
      throw new AuthValidationError(
        'Escribe tu número de celular o tu correo para enviarte el código de verificación.',
        'contacto',
      );
    }

    if (tieneCorreo && !FORMATO_CORREO.test(correoLimpio!)) {
      throw new AuthValidationError(
        'Escribe un correo válido, por ejemplo nombre@correo.com.',
        'correo',
      );
    }

    // 5. Validar consentimiento (Ley 1581)
    if (!solicitud.aceptaAvisoPrivacidad) {
      throw new AuthValidationError(
        'Para crear tu cuenta debes leer y aceptar el aviso de privacidad.',
        'aceptaAvisoPrivacidad',
      );
    }

    // 6. Determinar canal de verificación
    let canalVerificacion = solicitud.canalVerificacion;
    if (!canalVerificacion) {
      canalVerificacion = tieneCorreo ? 'CORREO' : 'TELEFONO';
    } else if (canalVerificacion === 'CORREO' && !tieneCorreo) {
      throw new AuthValidationError(
        'Elegiste recibir el código por correo, pero no escribiste un correo.',
        'canalVerificacion',
      );
    } else if (canalVerificacion === 'TELEFONO' && !celularLimpio) {
      throw new AuthValidationError(
        'Elegiste recibir el código por mensaje de texto, pero no escribiste un celular.',
        'canalVerificacion',
      );
    }

    return this.authRepository.solicitarRegistro({
      nombre,
      numeroIdentificacion: docLimpio,
      fechaNacimiento: fechaTexto,
      correo: tieneCorreo ? correoLimpio : undefined,
      telefono: celularLimpio,
      aceptaAvisoPrivacidad: true,
      canalVerificacion,
    });
  }
}
