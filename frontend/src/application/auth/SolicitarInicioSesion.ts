import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type { CodigoEnviado, SolicitudInicioSesion } from '@/domain/auth/types';

export class SolicitarInicioSesion {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(datos: SolicitudInicioSesion): Promise<CodigoEnviado> {
    const numeroIdentificacion = datos?.numeroIdentificacion?.trim();
    if (!numeroIdentificacion) {
      throw new AuthValidationError(
        'Escribe tu número de identificación.',
        'numeroIdentificacion',
      );
    }
    if (numeroIdentificacion.length > 30) {
      throw new AuthValidationError(
        'El número de identificación es demasiado largo.',
        'numeroIdentificacion',
      );
    }

    const contacto = datos?.contacto?.trim();
    if (!contacto) {
      throw new AuthValidationError(
        'Escribe tu correo o tu número de celular.',
        'contacto',
      );
    }
    if (contacto.length > 254) {
      throw new AuthValidationError(
        'El correo o celular es demasiado largo.',
        'contacto',
      );
    }

    if (contacto.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contacto)) {
        throw new AuthValidationError(
          'Escribe un correo electrónico válido, por ejemplo: ana@correo.com.',
          'contacto',
        );
      }
    } else {
      const soloDigitos = contacto.replace(/[\s\-+]/g, '');
      if (!/^\d{7,15}$/.test(soloDigitos)) {
        throw new AuthValidationError(
          'Escribe un número de celular válido de 10 dígitos, por ejemplo: 3001234567.',
          'contacto',
        );
      }
    }

    return this.authRepository.solicitarInicioSesion({
      numeroIdentificacion,
      contacto,
    });
  }
}
