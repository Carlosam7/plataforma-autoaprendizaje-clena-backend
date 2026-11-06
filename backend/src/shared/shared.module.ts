import { Global, Module } from '@nestjs/common';
import { GENERADOR_ID, RELOJ } from './application/tokens.js';
import { GeneradorUuid, RelojSistema } from './infrastructure/sistema.js';

@Global()
@Module({
  providers: [
    { provide: RELOJ, useClass: RelojSistema },
    { provide: GENERADOR_ID, useClass: GeneradorUuid },
  ],
  exports: [RELOJ, GENERADOR_ID],
})
export class SharedModule {}
