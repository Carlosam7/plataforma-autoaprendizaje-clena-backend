import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type { CodigoEnviado, SolicitudRegistro } from '@/domain/auth/types';

function generarIdentificador(semilla: string): string {
  let hash = 0;
  for (let i = 0; i < semilla.length; i++) {
    hash = (hash << 5) - hash + semilla.charCodeAt(i);
    hash |= 0;
  }
  const parte = Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
  return `KM${parte}`.slice(0, 15);
}

export class SolicitarRegistro {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(solicitud: SolicitudRegistro): Promise<CodigoEnviado> {
    const nombre = solicitud.nombre?.trim();
    if (!nombre || nombre.length < 2 || nombre.length > 100) {
      throw new AuthValidationError(
        'Escribe tu nombre, entre 2 y 100 letras.',
        'nombre',
      );
    }

    const correoLimpio = solicitud.correo?.trim().toLowerCase();
    const tieneCorreo = Boolean(correoLimpio);
    const tieneTelefono = Boolean(solicitud.telefono?.trim());

    if (!tieneCorreo && !tieneTelefono) {
      throw new AuthValidationError(
        'Escribe tu correo electrónico para enviarte el código de acceso.',
        'correo',
      );
    }

    if (tieneCorreo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio!)) {
      throw new AuthValidationError(
        'Escribe un correo válido, por ejemplo nombre@correo.com.',
        'correo',
      );
    }

    // Identificador para el backend (cédula si se suministró o generado a partir del correo)
    const docLimpio = solicitud.numeroIdentificacion
      ?.trim()
      .replace(/[\s.-]/g, '');
    const numeroIdentificacion =
      docLimpio && docLimpio.length >= 4 && docLimpio.length <= 15
        ? docLimpio
        : generarIdentificador(correoLimpio || solicitud.telefono || nombre);

    // Fecha de nacimiento por defecto si no se solicita en este formulario simplificado
    const fechaNacimiento =
      solicitud.fechaNacimiento &&
      /^\d{4}-\d{2}-\d{2}$/.test(solicitud.fechaNacimiento)
        ? solicitud.fechaNacimiento
        : '2000-01-01';

    const aceptaAvisoPrivacidad =
      solicitud.aceptaAvisoPrivacidad !== undefined
        ? solicitud.aceptaAvisoPrivacidad
        : true;

    if (!aceptaAvisoPrivacidad) {
      throw new AuthValidationError(
        'Debes aceptar el tratamiento de datos para continuar.',
        'aceptaAvisoPrivacidad',
      );
    }

    return this.authRepository.solicitarRegistro({
      nombre,
      correo: correoLimpio,
      telefono: solicitud.telefono?.trim(),
      numeroIdentificacion,
      fechaNacimiento,
      aceptaAvisoPrivacidad,
      canalVerificacion: solicitud.canalVerificacion || 'CORREO',
    });
  }
}
