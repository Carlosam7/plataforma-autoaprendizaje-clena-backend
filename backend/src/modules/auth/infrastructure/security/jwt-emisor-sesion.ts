import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { GeneradorId } from '../../../../shared/application/generador-id.port.js';
import { Reloj } from '../../../../shared/application/reloj.port.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { VariablesEntorno } from '../../../../config/variables-entorno.js';
import { Rol } from '../../domain/tipos.js';
import {
  EmisorSesion,
  SesionEmitida,
} from '../../application/ports/emisor-sesion.port.js';

/**
 * Access token: JWT firmado y de vida corta.
 * Refresh token: valor opaco `<idSesion>.<secreto>`. Solo se guarda el SHA-256 del secreto,
 * que tiene 256 bits de entropía, así que un hash rápido es suficiente.
 */
export class JwtEmisorSesion implements EmisorSesion {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<VariablesEntorno, true>,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async iniciar(usuario: { id: string; rol: Rol }): Promise<SesionEmitida> {
    const ahora = this.reloj.ahora();
    const accessSegundos = this.config.get('JWT_ACCESS_EXPIRES_IN_SEGUNDOS', {
      infer: true,
    });
    const refreshHoras = this.config.get('REFRESH_TOKEN_TTL_HORAS', {
      infer: true,
    });

    const idSesion = this.generadorId.generar();
    const secreto = randomBytes(32).toString('base64url');
    const refreshTokenExpiraEn = new Date(
      ahora.getTime() + refreshHoras * 3_600_000,
    );

    await this.prisma.sesion.create({
      data: {
        id: idSesion,
        usuarioId: usuario.id,
        refreshTokenHash: createHash('sha256').update(secreto).digest('hex'),
        expiraEn: refreshTokenExpiraEn,
        creadaEn: ahora,
      },
    });

    const accessToken = await this.jwt.signAsync(
      { sub: usuario.id, rol: usuario.rol, sid: idSesion },
      { expiresIn: accessSegundos },
    );

    return {
      accessToken,
      accessTokenExpiraEn: new Date(ahora.getTime() + accessSegundos * 1000),
      refreshToken: `${idSesion}.${secreto}`,
      refreshTokenExpiraEn,
    };
  }
}
