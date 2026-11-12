import { Global, Module } from '@nestjs/common';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { GeneradorUuid, RelojSistema } from '../infrastructure/sistema.js';

// Servicios del sistema (hora actual, ids) que usan varios casos de uso.
@Global()
@Module({
  providers: [
    { provide: Reloj, useClass: RelojSistema },
    { provide: GeneradorId, useClass: GeneradorUuid },
  ],
  exports: [Reloj, GeneradorId],
})
export class SistemaModule {}
