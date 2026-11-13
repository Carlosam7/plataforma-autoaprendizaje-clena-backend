import { SetMetadata } from '@nestjs/common';
import { Rol } from '../../domain/auth/tipos.js';

export const ROLES_PERMITIDOS = 'rolesPermitidos';

/** Restringe un endpoint (o un controlador) a los roles indicados. Lo aplica `RolesGuard`. */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_PERMITIDOS, roles);
