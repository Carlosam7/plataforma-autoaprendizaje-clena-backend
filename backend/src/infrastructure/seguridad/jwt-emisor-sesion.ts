import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import {
  EmisorSesion,
  RefreshTokenGuardado,
  SesionEmitida,
  TitularSesion,
} from '../../application/auth/emisor-sesion.port.js';
import { GeneradorId } from '../../application/shared/generador-id.port.js';
import { Reloj } from '../../application/shared/reloj.port.js';
import { SesionInvalidaError } from '../../domain/auth/errores.js';
import { VariablesEntorno } from '../config/variables-entorno.js';
import { Prisma } from '../database/prisma/generated/client.js';
import { PrismaService } from '../database/prisma.service.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Access token: JWT firmado y de vida corta, con `{ sid, rol }`.
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

  async iniciar(usuario: TitularSesion): Promise<SesionEmitida> {
    const { sesion } = await this.emitir(
      this.prisma,
      usuario,
      this.reloj.ahora(),
    );
    return sesion;
  }

  async buscar(refreshToken: string): Promise<RefreshTokenGuardado | null> {
    const [id, secreto, ...resto] = refreshToken.split('.');
    // Un id que no es uuid haría fallar la consulta en PostgreSQL.
    if (!id || !secreto || resto.length > 0 || !UUID.test(id)) return null;

    const fila = await this.prisma.refreshToken.findFirst({
      where: { id, tokenHash: hashDe(secreto) },
      select: {
        id: true,
        usuarioPublicoId: true,
        expiraEn: true,
        revocadoEn: true,
        reemplazadoPorId: true,
        personal: { select: { id: true, rol: true, activo: true } },
      },
    });
    if (!fila) return null;

    const titular: TitularSesion | null = fila.usuarioPublicoId
      ? { id: fila.usuarioPublicoId, rol: 'USUARIO_PUBLICO' }
      : fila.personal
        ? { id: fila.personal.id, rol: fila.personal.rol }
        : null;
    if (!titular) return null;

    return {
      id: fila.id,
      titular,
      expiraEn: fila.expiraEn,
      revocadoEn: fila.revocadoEn,
      reemplazadoPorId: fila.reemplazadoPorId,
      titularActivo: fila.personal?.activo ?? true,
    };
  }

  rotar(anterior: RefreshTokenGuardado, ahora: Date): Promise<SesionEmitida> {
    return this.prisma.$transaction(async (tx) => {
      const { id, sesion } = await this.emitir(tx, anterior.titular, ahora);
      // Solo se rota si sigue vigente: de dos peticiones simultáneas con el mismo token,
      // una gana y la otra se deshace con la transacción.
      const { count } = await tx.refreshToken.updateMany({
        where: { id: anterior.id, revocadoEn: null },
        data: { revocadoEn: ahora, reemplazadoPorId: id },
      });
      if (count === 0) throw new SesionInvalidaError();
      return sesion;
    });
  }

  async revocar(refreshTokenId: string, ahora: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { id: refreshTokenId, revocadoEn: null },
      data: { revocadoEn: ahora },
    });
  }

  async revocarTodas(titular: TitularSesion, ahora: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { ...titularDe(titular), revocadoEn: null },
      data: { revocadoEn: ahora },
    });
  }

  private async emitir(
    db: Prisma.TransactionClient,
    usuario: TitularSesion,
    ahora: Date,
  ): Promise<{ id: string; sesion: SesionEmitida }> {
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

    await db.refreshToken.create({
      data: {
        id,
        ...titularDe(usuario),
        tokenHash: hashDe(secreto),
        expiraEn: refreshTokenExpiraEn,
        creadoEn: ahora,
      },
    });

    // El JWT solo va firmado, no cifrado: cualquiera que lo tenga puede leerlo. Por eso no
    // lleva datos personales (la cédula es la llave del usuario público), solo el id de la
    // sesión; quien necesite saber el usuario lo busca en refresh_token por ese id.
    const accessToken = await this.jwt.signAsync(
      { sid: id, rol: usuario.rol },
      { expiresIn: accessSegundos },
    );

    return {
      id,
      sesion: {
        accessToken,
        accessTokenExpiraEn: new Date(ahora.getTime() + accessSegundos * 1000),
        refreshToken: `${id}.${secreto}`,
        refreshTokenExpiraEn,
      },
    };
  }
}

function hashDe(secreto: string): string {
  return createHash('sha256').update(secreto).digest('hex');
}

// El usuario público se identifica por su número de identificación; el personal, por uuid.
function titularDe(
  usuario: TitularSesion,
): { usuarioPublicoId: string } | { personalId: string } {
  return usuario.rol === 'USUARIO_PUBLICO'
    ? { usuarioPublicoId: usuario.id }
    : { personalId: usuario.id };
}
