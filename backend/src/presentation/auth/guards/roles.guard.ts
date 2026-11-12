import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../../domain/auth/tipos.js';
import { ROLES_PERMITIDOS } from '../../shared/roles.decorator.js';
import { PeticionAutenticada } from '../../shared/usuario-actual.decorator.js';

/**
 * Guard global que corre después de `JwtAuthGuard`. Si la ruta declara @Roles(...) y el
 * usuario no tiene ninguno de esos roles, responde 403. Sin @Roles basta con estar autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_PERMITIDOS,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!roles?.length) return true;

    const { usuario } = ctx.switchToHttp().getRequest<PeticionAutenticada>();
    if (!usuario || !roles.includes(usuario.rol))
      throw new ForbiddenException();
    return true;
  }
}
