import { Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../../../domain/auth/usuario.repository.js';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { NumeroIdentificacion } from '../../../domain/auth/value-objects/numero-identificacion.js';
import { Telefono } from '../../../domain/auth/value-objects/telefono.js';
import { PrismaService } from '../prisma.service.js';

// Una cuenta existe cuando al menos uno de sus métodos de inicio está verificado;
// un usuario_publico sin métodos verificados es un registro pendiente.
const VERIFICADO = { verificadoEn: { not: null } };

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existePorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<boolean> {
    const total = await this.prisma.usuarioPublico.count({
      where: {
        numeroIdentificacion: numero.valor,
        metodosInicio: { some: VERIFICADO },
      },
    });
    return total > 0;
  }

  existePorTelefono(telefono: Telefono): Promise<boolean> {
    return this.perteneceACuenta('TELEFONO', telefono.valor);
  }

  existePorCorreo(correo: Correo): Promise<boolean> {
    return this.perteneceACuenta('CORREO', correo.valor);
  }

  /** El dato pertenece a una cuenta activa, aunque ese dato en particular no se haya verificado. */
  private async perteneceACuenta(
    tipo: 'CORREO' | 'TELEFONO',
    valor: string,
  ): Promise<boolean> {
    const total = await this.prisma.metodoInicio.count({
      where: { tipo, valor, usuario: { metodosInicio: { some: VERIFICADO } } },
    });
    return total > 0;
  }
}
