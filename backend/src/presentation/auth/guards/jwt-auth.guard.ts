import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidarSesionUseCase } from '../../../application/auth/validar-sesion.use-case.js';
import { ES_PUBLICO } from '../../shared/publico.decorator.js';
import { PeticionAutenticada } from '../../shared/usuario-actual.decorator.js';

/**
 * Guard global: toda ruta exige `Authorization: Bearer <access token>`, salvo las marcadas
 * con @Publico(). Sin token o con uno inválido responde 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly validarSesion: ValidarSesionUseCase,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (esPublico) return true;

    const peticion = ctx.switchToHttp().getRequest<PeticionAutenticada>();
    const token = extraerBearer(peticion.headers.authorization);
    if (!token) throw new UnauthorizedException();

    // Si la sesión no es válida, el caso de uso lanza SesionInvalidaError (401).
    peticion.usuario = await this.validarSesion.ejecutar(token);
    return true;
  }
}

function extraerBearer(cabecera: string | undefined): string | null {
  const [tipo, token] = cabecera?.split(' ') ?? [];
  return tipo?.toLowerCase() === 'bearer' && token ? token : null;
}
