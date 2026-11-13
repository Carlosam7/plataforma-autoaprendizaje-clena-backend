import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidarSesionUseCase } from '../../../application/auth/validar-sesion.use-case.js';
import { SesionInvalidaError } from '../../../domain/auth/errores.js';
import { ES_PUBLICO, SESION_OPCIONAL } from '../../shared/publico.decorator.js';
import { PeticionAutenticada } from '../../shared/usuario-actual.decorator.js';

/**
 * Guard global: toda ruta exige `Authorization: Bearer <access token>`, salvo las marcadas
 * con @Publico(). Sin token o con uno inválido responde 401.
 * Las rutas públicas ignoran el token, salvo las @SesionOpcional(): ahí, si es válido, se
 * identifica al usuario y si no, la petición sigue como anónima.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly validarSesion: ValidarSesionUseCase,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const marca = (clave: string) =>
      this.reflector.getAllAndOverride<boolean>(clave, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    const peticion = ctx.switchToHttp().getRequest<PeticionAutenticada>();
    const token = extraerBearer(peticion.headers.authorization);

    if (marca(ES_PUBLICO)) {
      if (token && marca(SESION_OPCIONAL)) {
        try {
          peticion.usuario = await this.validarSesion.ejecutar(token);
        } catch (error) {
          if (!(error instanceof SesionInvalidaError)) throw error;
        }
      }
      return true;
    }

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
