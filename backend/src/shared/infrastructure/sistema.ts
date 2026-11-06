import { randomUUID } from 'node:crypto';
import { GeneradorId } from '../application/generador-id.port.js';
import { Reloj } from '../application/reloj.port.js';

export class RelojSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}

export class GeneradorUuid implements GeneradorId {
  generar(): string {
    return randomUUID();
  }
}
