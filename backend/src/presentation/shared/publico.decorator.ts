import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';

/**
 * Marca un endpoint (o un controlador entero) como accesible sin token.
 * El `JwtAuthGuard` global protege todo lo que no lleve esta marca.
 */
export const Publico = () => SetMetadata(ES_PUBLICO, true);
