import { Injectable } from '@nestjs/common';
import { CodigoInicioSesion } from '../../../domain/auth/codigo-inicio-sesion.js';
import {
  ContactoCuenta,
  EliminacionCuentaRepository,
} from '../../../domain/auth/eliminacion-cuenta.repository.js';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { Telefono } from '../../../domain/auth/value-objects/telefono.js';
import { PrismaService } from '../prisma.service.js';
import {
  emitirCodigo,
  reservarIntento,
  ultimoCodigoSinUsar,
} from './codigos-metodo-inicio.js';

const PROPOSITO = 'ELIMINAR_CUENTA';

@Injectable()
export class PrismaEliminacionCuentaRepository implements EliminacionCuentaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async contactos(usuarioId: string): Promise<ContactoCuenta[]> {
    const filas = await this.prisma.metodoInicio.findMany({
      where: { usuarioId, verificadoEn: { not: null } },
      orderBy: { creadoEn: 'asc' },
    });
    return filas.map((f) => ({
      metodoInicioId: f.id,
      canal: f.tipo,
      destino:
        f.tipo === 'TELEFONO' ? Telefono.crear(f.valor) : Correo.crear(f.valor),
    }));
  }

  ultimoCodigoSinUsar(
    metodoInicioId: string,
  ): Promise<CodigoInicioSesion | null> {
    return ultimoCodigoSinUsar(this.prisma, metodoInicioId, PROPOSITO);
  }

  emitirCodigo(codigo: CodigoInicioSesion): Promise<void> {
    return emitirCodigo(this.prisma, codigo, PROPOSITO);
  }

  reservarIntento(codigoId: string, maxIntentos: number): Promise<boolean> {
    return reservarIntento(this.prisma, codigoId, maxIntentos);
  }

  async eliminar(usuarioId: string): Promise<void> {
    // Un solo DELETE: PostgreSQL lo ejecuta todo o nada, y las llaves foráneas hacen el
    // resto (modelo de datos, sección 6.2). ON DELETE CASCADE borra metodo_inicio y sus
    // códigos, consentimiento, refresh_token, progreso_guia, paso_leido e intento con sus
    // respuestas. ON DELETE SET NULL deja sin dueño consulta_guia, solicitud_ayuda y
    // calificacion, que alimentan las estadísticas.
    // deleteMany y no delete: si la cuenta ya no existe (doble clic), no es un error.
    await this.prisma.usuarioPublico.deleteMany({
      where: { numeroIdentificacion: usuarioId },
    });
  }
}
