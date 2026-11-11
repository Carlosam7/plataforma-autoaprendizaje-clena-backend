import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import {
  EmisorSesion,
  SesionEmitida,
} from '../../application/auth/emisor-sesion.port.js';
import { GeneradorId } from '../../application/shared/generador-id.port.js';
import { Reloj } from '../../application/shared/reloj.port.js';
import { Rol } from '../../domain/auth/tipos.js';
import { VariablesEntorno } from '../config/variables-entorno.js';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Access token: JWT firmado y de vida corta.
 * Refresh token: valor opaco `<id>.<secreto>`. En la tabla refresh_token solo se guarda el
 * SHA-256 del secreto, que tiene 256 bits de entropía, así que un hash rápido es suficiente.
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

    const id = this.generadorId.generar();
    const secreto = randomBytes(32).toString('base64url');
    const refreshTokenExpiraEn = new Date(
      ahora.getTime() + refreshHoras * 3_600_000,
    );

    // El usuario público se identifica por su número de identificación; el personal, por uuid.
    const titular =
      usuario.rol === 'USUARIO_PUBLICO'
        ? { usuarioPublicoId: usuario.id }
        : { personalId: usuario.id };

    await this.prisma.refreshToken.create({
      data: {
        id,
        ...titular,
        tokenHash: createHash('sha256').update(secreto).digest('hex'),
        expiraEn: refreshTokenExpiraEn,
        creadoEn: ahora,
      },
    });

    const accessToken = await this.jwt.signAsync(
      { sub: usuario.id, rol: usuario.rol, sid: id },
      { expiresIn: accessSegundos },
    );

    return {
      accessToken,
      accessTokenExpiraEn: new Date(ahora.getTime() + accessSegundos * 1000),
      refreshToken: `${id}.${secreto}`,
      refreshTokenExpiraEn,
    };
  }
}
