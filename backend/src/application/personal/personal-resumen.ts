import { Personal, RolPersonal } from '../../domain/personal/personal.js';

/** Lo que la API devuelve de una cuenta del personal. Nunca incluye el hash de la contraseña. */
export interface PersonalResumen {
  id: string;
  nombre: string;
  correo: string;
  rol: RolPersonal;
  activo: boolean;
  debeCambiarPassword: boolean;
  ultimoAccesoEn: Date | null;
  creadoEn: Date;
}

export function aResumen(personal: Personal): PersonalResumen {
  return {
    id: personal.id,
    nombre: personal.nombre.valor,
    correo: personal.correo.valor,
    rol: personal.rol,
    activo: personal.activo,
    debeCambiarPassword: personal.debeCambiarPassword,
    ultimoAccesoEn: personal.ultimoAccesoEn,
    creadoEn: personal.creadoEn,
  };
}
