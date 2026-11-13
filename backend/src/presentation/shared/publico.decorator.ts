import { applyDecorators, SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';
export const SESION_OPCIONAL = 'sesionOpcional';

/**
 * Marca un endpoint (o un controlador entero) como accesible sin token.
 * El `JwtAuthGuard` global protege todo lo que no lleve esta marca.
 */
export const Publico = () => SetMetadata(ES_PUBLICO, true);

/**
 * Endpoint público que, si llega un token válido, identifica al usuario (@UsuarioOpcional).
 * Con un token inválido no responde 401: sigue como anónimo. Las demás rutas públicas
 * ignoran el token.
 */
export const SesionOpcional = () =>
  applyDecorators(
    SetMetadata(ES_PUBLICO, true),
    SetMetadata(SESION_OPCIONAL, true),
  );
