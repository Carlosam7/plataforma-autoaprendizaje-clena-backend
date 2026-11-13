import { Injectable } from '@nestjs/common';
import {
  AvisoPrivacidadNoDisponibleError,
  CorreoEnUsoError,
  TelefonoEnUsoError,
} from '../../../domain/auth/errores.js';
import { RegistroPendiente } from '../../../domain/auth/registro-pendiente.js';
import { RegistroPendienteRepository } from '../../../domain/auth/registro-pendiente.repository.js';
import { Consentimiento } from '../../../domain/auth/value-objects/consentimiento.js';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { FechaNacimiento } from '../../../domain/auth/value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../../../domain/auth/value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../../../domain/auth/value-objects/numero-identificacion.js';
import { Telefono } from '../../../domain/auth/value-objects/telefono.js';
import { descripcionConflictoUnicidad } from '../errores-prisma.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

/*
 * Un registro pendiente no tiene tabla propia en el modelo de datos. Se guarda como:
 *   usuario_publico  → nombre, identificación y fecha de nacimiento
 *   metodo_inicio    → correo y/o celular, con verificado_en = null
 *   consentimiento   → aceptación del aviso de privacidad vigente
 *   codigo_verificacion (REGISTRO) → en el método por el que se envió el código
 * El id del registro es el del metodo_inicio que recibió el código. Al verificar, ese
 * método queda con verificado_en y la cuenta pasa a estar activa.
 */

const SIN_VERIFICAR = { verificadoEn: null };

const INCLUIR = {
  metodosInicio: {
    include: {
      codigosVerificacion: {
        where: { proposito: 'REGISTRO', usadoEn: null },
        orderBy: { creadoEn: 'desc' },
        take: 1,
      },
    },
  },
  consentimientos: {
    include: { avisoPrivacidad: true },
    orderBy: { aceptadoEn: 'desc' },
    take: 1,
  },
} satisfies Prisma.UsuarioPublicoInclude;

type UsuarioConRegistro = Prisma.UsuarioPublicoGetPayload<{
  include: typeof INCLUIR;
}>;

@Injectable()
export class PrismaRegistroPendienteRepository implements RegistroPendienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<RegistroPendiente | null> {
    const metodo = await this.prisma.metodoInicio.findUnique({
      where: { id },
      select: { usuarioId: true },
    });
    const registro = metodo ? await this.cargar(metodo.usuarioId) : null;
    return registro?.id === id ? registro : null;
  }

  buscarPorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<RegistroPendiente | null> {
    return this.cargar(numero.valor);
  }

  async buscarPorContacto(
    contacto: Correo | Telefono,
  ): Promise<RegistroPendiente | null> {
    const metodo = await this.prisma.metodoInicio.findUnique({
      where: { tipo_valor: { tipo: tipoDe(contacto), valor: contacto.valor } },
      select: { usuarioId: true, verificadoEn: true },
    });
    if (!metodo || metodo.verificadoEn) return null;
    return this.cargar(metodo.usuarioId);
  }

  async guardar(registro: RegistroPendiente): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const aviso = await tx.avisoPrivacidad.findUnique({
          where: { version: registro.consentimiento.versionAviso },
          select: { id: true },
        });
        if (!aviso) throw new AvisoPrivacidadNoDisponibleError();

        const usuarioId = registro.numeroIdentificacion.valor;
        await tx.usuarioPublico.upsert({
          where: { numeroIdentificacion: usuarioId },
          create: {
            numeroIdentificacion: usuarioId,
            nombre: registro.nombre.valor,
            fechaNacimiento: registro.fechaNacimiento.valor,
            creadoEn: registro.creadoEn,
          },
          update: {
            nombre: registro.nombre.valor,
            fechaNacimiento: registro.fechaNacimiento.valor,
          },
        });

        // Los contactos y el código se reescriben completos: así un reintento puede
        // cambiar de celular o de correo. El borrado arrastra los códigos (CASCADE).
        await tx.metodoInicio.deleteMany({
          where: { usuarioId, ...SIN_VERIFICAR },
        });
        for (const contacto of [registro.telefono, registro.correo]) {
          if (!contacto) continue;
          const tipo = tipoDe(contacto);
          await tx.metodoInicio.create({
            data: {
              ...(tipo === registro.canal ? { id: registro.id } : {}),
              usuarioId,
              tipo,
              valor: contacto.valor,
            },
          });
        }
        await tx.codigoVerificacion.create({
          data: {
            proposito: 'REGISTRO',
            metodoInicioId: registro.id,
            codigoHash: registro.codigoHash,
            intentos: registro.intentosFallidos,
            expiraEn: registro.codigoExpiraEn,
            creadoEn: registro.codigoEnviadoEn,
          },
        });

        await tx.consentimiento.upsert({
          where: {
            usuarioId_avisoPrivacidadId: {
              usuarioId,
              avisoPrivacidadId: aviso.id,
            },
          },
          create: {
            usuarioId,
            avisoPrivacidadId: aviso.id,
            aceptadoEn: registro.consentimiento.aceptadoEn,
          },
          update: { aceptadoEn: registro.consentimiento.aceptadoEn },
        });
      });
    } catch (error) {
      if (descripcionConflictoUnicidad(error) === null) throw error;
      // Otra persona reservó el correo o el celular entre la comprobación y el guardado.
      throw (await this.telefonoOcupadoPorOtro(registro))
        ? new TelefonoEnUsoError()
        : new CorreoEnUsoError();
    }
  }

  async reservarIntento(
    registroId: string,
    maxIntentos: number,
  ): Promise<boolean> {
    const { count } = await this.prisma.codigoVerificacion.updateMany({
      where: {
        metodoInicioId: registroId,
        proposito: 'REGISTRO',
        usadoEn: null,
        intentos: { lt: maxIntentos },
      },
      data: { intentos: { increment: 1 } },
    });
    return count > 0;
  }

  async confirmar(registro: RegistroPendiente, ahora: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.metodoInicio.update({
        where: { id: registro.id },
        data: { verificadoEn: ahora },
      }),
      this.prisma.codigoVerificacion.updateMany({
        where: {
          metodoInicioId: registro.id,
          proposito: 'REGISTRO',
          usadoEn: null,
        },
        data: { usadoEn: ahora },
      }),
    ]);
  }

  async eliminar(id: string): Promise<void> {
    const metodo = await this.prisma.metodoInicio.findUnique({
      where: { id },
      select: { usuarioId: true },
    });
    if (!metodo) return;
    // Solo si ninguno de sus contactos está verificado: nunca se borra una cuenta activa.
    await this.prisma.usuarioPublico.deleteMany({
      where: {
        numeroIdentificacion: metodo.usuarioId,
        metodosInicio: { none: { verificadoEn: { not: null } } },
      },
    });
  }

  private async cargar(usuarioId: string): Promise<RegistroPendiente | null> {
    const usuario = await this.prisma.usuarioPublico.findUnique({
      where: { numeroIdentificacion: usuarioId },
      include: INCLUIR,
    });
    return usuario ? aDominio(usuario) : null;
  }

  private async telefonoOcupadoPorOtro(
    registro: RegistroPendiente,
  ): Promise<boolean> {
    if (!registro.telefono) return false;
    const metodo = await this.prisma.metodoInicio.findUnique({
      where: {
        tipo_valor: { tipo: 'TELEFONO', valor: registro.telefono.valor },
      },
      select: { usuarioId: true },
    });
    return (
      metodo !== null &&
      metodo.usuarioId !== registro.numeroIdentificacion.valor
    );
  }
}

function tipoDe(contacto: Correo | Telefono): 'CORREO' | 'TELEFONO' {
  return contacto instanceof Telefono ? 'TELEFONO' : 'CORREO';
}

/** Devuelve null si el usuario ya tiene un contacto verificado: entonces es una cuenta, no un registro. */
function aDominio(usuario: UsuarioConRegistro): RegistroPendiente | null {
  const metodos = usuario.metodosInicio;
  if (metodos.some((m) => m.verificadoEn !== null)) return null;

  const canal = metodos.find((m) => m.codigosVerificacion.length > 0);
  const consentimiento = usuario.consentimientos[0];
  if (!canal || !consentimiento) return null;

  const codigo = canal.codigosVerificacion[0];
  const telefono = metodos.find((m) => m.tipo === 'TELEFONO');
  const correo = metodos.find((m) => m.tipo === 'CORREO');

  return RegistroPendiente.reconstituir({
    id: canal.id,
    nombre: NombrePersona.crear(usuario.nombre),
    numeroIdentificacion: NumeroIdentificacion.crear(
      usuario.numeroIdentificacion,
    ),
    fechaNacimiento: FechaNacimiento.reconstituir(usuario.fechaNacimiento),
    telefono: telefono ? Telefono.crear(telefono.valor) : null,
    correo: correo ? Correo.crear(correo.valor) : null,
    consentimiento: Consentimiento.reconstituir(
      consentimiento.avisoPrivacidad.version,
      consentimiento.aceptadoEn,
    ),
    canal: canal.tipo,
    codigoHash: codigo.codigoHash,
    codigoEnviadoEn: codigo.creadoEn,
    codigoExpiraEn: codigo.expiraEn,
    intentosFallidos: codigo.intentos,
    creadoEn: usuario.creadoEn,
  });
}
