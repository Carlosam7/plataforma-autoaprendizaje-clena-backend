import { Injectable } from '@nestjs/common';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { NombrePersona } from '../../../domain/auth/value-objects/nombre-persona.js';
import { CorreoPersonalEnUsoError } from '../../../domain/personal/errores.js';
import { Personal } from '../../../domain/personal/personal.js';
import {
  CriterioPersonal,
  PersonalRepository,
} from '../../../domain/personal/personal.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { descripcionConflictoUnicidad } from '../errores-prisma.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

type FilaPersonal = Prisma.PersonalGetPayload<object>;

@Injectable()
export class PrismaPersonalRepository implements PersonalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Personal | null> {
    const fila = await this.prisma.personal.findUnique({ where: { id } });
    return fila ? aDominio(fila) : null;
  }

  async existeCorreo(correo: Correo, exceptoId?: string): Promise<boolean> {
    const total = await this.prisma.personal.count({
      where: {
        correo: correo.valor,
        ...(exceptoId ? { id: { not: exceptoId } } : {}),
      },
    });
    return total > 0;
  }

  async crear(personal: Personal): Promise<void> {
    await this.conCorreoUnico(() =>
      this.prisma.personal.create({
        data: {
          ...datosEditables(personal),
          id: personal.id,
          creadoPorId: personal.creadoPorId,
          creadoEn: personal.creadoEn,
        },
      }),
    );
  }

  async actualizar(personal: Personal): Promise<void> {
    await this.conCorreoUnico(() =>
      this.prisma.personal.update({
        where: { id: personal.id },
        data: datosEditables(personal),
      }),
    );
  }

  async listar({
    q,
    rol,
    activo,
    ordenarPor,
    direccion,
    pagina,
    limite,
  }: CriterioPersonal): Promise<Pagina<Personal>> {
    const where: Prisma.PersonalWhereInput = {
      ...(rol ? { rol } : {}),
      ...(activo === undefined ? {} : { activo }),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { correo: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.personal.findMany({
        where,
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [ordenarPor]: direccion }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.personal.count({ where }),
    ]);
    return { elementos: filas.map(aDominio), total };
  }

  /** Otra petición pudo tomar el correo entre la comprobación y el guardado. */
  private async conCorreoUnico(
    operacion: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await operacion();
    } catch (error) {
      if (descripcionConflictoUnicidad(error) !== null) {
        throw new CorreoPersonalEnUsoError();
      }
      throw error;
    }
  }
}

function datosEditables(personal: Personal) {
  return {
    nombre: personal.nombre.valor,
    correo: personal.correo.valor,
    rol: personal.rol,
    activo: personal.activo,
    debeCambiarPassword: personal.debeCambiarPassword,
    passwordHash: personal.passwordHash,
  };
}

function aDominio(fila: FilaPersonal): Personal {
  return Personal.reconstituir({
    id: fila.id,
    nombre: NombrePersona.crear(fila.nombre),
    correo: Correo.crear(fila.correo),
    rol: fila.rol,
    activo: fila.activo,
    debeCambiarPassword: fila.debeCambiarPassword,
    passwordHash: fila.passwordHash,
    creadoPorId: fila.creadoPorId,
    ultimoAccesoEn: fila.ultimoAccesoEn,
    creadoEn: fila.creadoEn,
  });
}
