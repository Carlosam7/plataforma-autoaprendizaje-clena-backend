import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ContenidoAccessToken,
  VerificadorAccessToken,
} from '../../application/auth/verificador-access-token.port.js';
import { Rol } from '../../domain/auth/tipos.js';

const ROLES: readonly Rol[] = ['USUARIO_PUBLICO', 'PERSONAL', 'ADMINISTRADOR'];

@Injectable()
export class JwtVerificadorAccessToken implements VerificadorAccessToken {
  constructor(private readonly jwt: JwtService) {}

  async verificar(token: string): Promise<ContenidoAccessToken | null> {
    try {
      const contenido =
        await this.jwt.verifyAsync<Record<string, unknown>>(token);
      const { sid, rol } = contenido;
      if (typeof sid !== 'string' || !ROLES.includes(rol as Rol)) return null;
      return { sid, rol: rol as Rol };
    } catch {
      // Firma inválida, token mal formado o vencido: para el cliente es lo mismo.
      return null;
    }
  }
}
