import { Injectable } from '@nestjs/common';
import { RegistroPendiente as RegistroPrisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { RegistroPendiente } from '../../domain/entities/registro-pendiente.js';
import { RegistroPendienteRepository } from '../../domain/repositories/registro-pendiente.repository.js';
import { Consentimiento } from '../../domain/value-objects/consentimiento.js';
import { Correo } from '../../domain/value-objects/correo.js';
import { FechaNacimiento } from '../../domain/value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../../domain/value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../../domain/value-objects/numero-identificacion.js';
import { Telefono } from '../../domain/value-objects/telefono.js';

@Injectable()
export class PrismaRegistroPendienteRepository implements RegistroPendienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<RegistroPendiente | null> {
    const fila = await this.prisma.registroPendiente.findUnique({
      where: { id },
    });
    return fila ? aDominio(fila) : null;
  }

  async buscarPorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<RegistroPendiente | null> {
    const fila = await this.prisma.registroPendiente.findUnique({
      where: { numeroIdentificacion: numero.valor },
    });
    return fila ? aDominio(fila) : null;
  }

  async guardar(registro: RegistroPendiente): Promise<void> {
    const datos = aPersistencia(registro);
    await this.prisma.registroPendiente.upsert({
      where: { id: registro.id },
      create: datos,
      update: datos,
    });
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.registroPendiente.deleteMany({ where: { id } });
  }
}

function aDominio(fila: RegistroPrisma): RegistroPendiente {
  return RegistroPendiente.reconstituir({
    id: fila.id,
    nombre: NombrePersona.crear(fila.nombre),
    numeroIdentificacion: NumeroIdentificacion.crear(fila.numeroIdentificacion),
    fechaNacimiento: FechaNacimiento.reconstituir(fila.fechaNacimiento),
    telefono: fila.telefono ? Telefono.crear(fila.telefono) : null,
    correo: fila.correo ? Correo.crear(fila.correo) : null,
    consentimiento: Consentimiento.reconstituir(
      fila.consentimientoVersion,
      fila.consentimientoAceptadoEn,
    ),
    canal: fila.canal,
    codigoHash: fila.codigoHash,
    codigoEnviadoEn: fila.codigoEnviadoEn,
    codigoExpiraEn: fila.codigoExpiraEn,
    intentosFallidos: fila.intentosFallidos,
    creadoEn: fila.creadoEn,
  });
}

function aPersistencia(registro: RegistroPendiente): RegistroPrisma {
  return {
    id: registro.id,
    nombre: registro.nombre.valor,
    numeroIdentificacion: registro.numeroIdentificacion.valor,
    fechaNacimiento: registro.fechaNacimiento.valor,
    telefono: registro.telefono?.valor ?? null,
    correo: registro.correo?.valor ?? null,
    consentimientoVersion: registro.consentimiento.versionAviso,
    consentimientoAceptadoEn: registro.consentimiento.aceptadoEn,
    canal: registro.canal,
    codigoHash: registro.codigoHash,
    codigoEnviadoEn: registro.codigoEnviadoEn,
    codigoExpiraEn: registro.codigoExpiraEn,
    intentosFallidos: registro.intentosFallidos,
    creadoEn: registro.creadoEn,
  };
}
