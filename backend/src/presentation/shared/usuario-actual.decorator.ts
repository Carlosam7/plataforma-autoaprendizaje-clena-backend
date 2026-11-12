import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';

/** Petición a la que `JwtAuthGuard` ya le asignó el usuario de la sesión. */
export interface PeticionAutenticada extends Request {
  usuario?: UsuarioAutenticado;
}

/** Inyecta en el controlador el usuario autenticado de la petición. */
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const usuario = ctx
      .switchToHttp()
      .getRequest<PeticionAutenticada>().usuario;
    // Solo pasa si se usa en un endpoint @Publico(): es un error de programación.
    if (!usuario)
      throw new Error('@UsuarioActual() requiere un endpoint protegido');
    return usuario;
  },
);
