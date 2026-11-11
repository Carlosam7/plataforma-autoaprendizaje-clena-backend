import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';

/** Marca un endpoint como accesible sin token. El guard global de JWT (HU-02) lo respeta. */
export const Publico = () => SetMetadata(ES_PUBLICO, true);
