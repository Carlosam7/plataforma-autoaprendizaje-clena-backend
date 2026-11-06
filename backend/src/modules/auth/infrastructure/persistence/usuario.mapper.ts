import { Usuario as UsuarioPrisma } from '../../../../generated/prisma/client.js';
import { Usuario } from '../../domain/entities/usuario.js';
import { Consentimiento } from '../../domain/value-objects/consentimiento.js';
import { Correo } from '../../domain/value-objects/correo.js';
import { FechaNacimiento } from '../../domain/value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../../domain/value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../../domain/value-objects/numero-identificacion.js';
import { Telefono } from '../../domain/value-objects/telefono.js';

type UsuarioCreacion = Omit<UsuarioPrisma, 'actualizadoEn'>;

export const UsuarioMapper = {
  aDominio(fila: UsuarioPrisma): Usuario {
    return Usuario.reconstituir({
      id: fila.id,
      nombre: NombrePersona.crear(fila.nombre),
      numeroIdentificacion: fila.numeroIdentificacion
        ? NumeroIdentificacion.crear(fila.numeroIdentificacion)
        : null,
      fechaNacimiento: fila.fechaNacimiento
        ? FechaNacimiento.reconstituir(fila.fechaNacimiento)
        : null,
      telefono: fila.telefono ? Telefono.crear(fila.telefono) : null,
      correo: fila.correo ? Correo.crear(fila.correo) : null,
      rol: fila.rol,
      estado: fila.estado,
      consentimiento:
        fila.consentimientoVersion && fila.consentimientoAceptadoEn
          ? Consentimiento.reconstituir(
              fila.consentimientoVersion,
              fila.consentimientoAceptadoEn,
            )
          : null,
      creadoEn: fila.creadoEn,
    });
  },

  aPersistencia(usuario: Usuario): UsuarioCreacion {
    return {
      id: usuario.id,
      nombre: usuario.nombre.valor,
      numeroIdentificacion: usuario.numeroIdentificacion?.valor ?? null,
      fechaNacimiento: usuario.fechaNacimiento?.valor ?? null,
      telefono: usuario.telefono?.valor ?? null,
      correo: usuario.correo?.valor ?? null,
      rol: usuario.rol,
      estado: usuario.estado,
      consentimientoVersion: usuario.consentimiento?.versionAviso ?? null,
      consentimientoAceptadoEn: usuario.consentimiento?.aceptadoEn ?? null,
      creadoEn: usuario.creadoEn,
    };
  },
};
