import { Injectable } from '@nestjs/common';
import { descripcionConflictoUnicidad } from '../../../../shared/infrastructure/prisma/errores-prisma.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { Usuario } from '../../domain/entities/usuario.js';
import {
  CorreoEnUsoError,
  IdentificacionYaRegistradaError,
  TelefonoEnUsoError,
} from '../../domain/errores.js';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository.js';
import { Correo } from '../../domain/value-objects/correo.js';
import { NumeroIdentificacion } from '../../domain/value-objects/numero-identificacion.js';
import { Telefono } from '../../domain/value-objects/telefono.js';
import { UsuarioMapper } from './usuario.mapper.js';

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existePorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<boolean> {
    return (
      (await this.prisma.usuario.count({
        where: { numeroIdentificacion: numero.valor },
      })) > 0
    );
  }

  async existePorTelefono(telefono: Telefono): Promise<boolean> {
    return (
      (await this.prisma.usuario.count({
        where: { telefono: telefono.valor },
      })) > 0
    );
  }

  async existePorCorreo(correo: Correo): Promise<boolean> {
    return (
      (await this.prisma.usuario.count({ where: { correo: correo.valor } })) > 0
    );
  }

  async crear(usuario: Usuario): Promise<void> {
    try {
      await this.prisma.usuario.create({
        data: UsuarioMapper.aPersistencia(usuario),
      });
    } catch (error) {
      const conflicto = descripcionConflictoUnicidad(error);
      if (conflicto === null) throw error;
      if (/identificacion/i.test(conflicto))
        throw new IdentificacionYaRegistradaError();
      if (/telefono/i.test(conflicto)) throw new TelefonoEnUsoError();
      if (/correo/i.test(conflicto)) throw new CorreoEnUsoError();
      throw error;
    }
  }
}
