import { createHash, randomBytes } from 'node:crypto';
import {
  LlaveSolicitud,
  LlavesSolicitudAyuda,
} from '../../application/ayuda/llaves-solicitud-ayuda.port.js';

/** 32 bytes aleatorios en base64url: 43 caracteres. */
const FORMATO_LLAVE = /^[A-Za-z0-9_-]{43}$/;

/**
 * Llaves de 256 bits, como el secreto del refresh token. La huella es SHA-256 sin sal:
 * basta porque la llave es aleatoria (no hay diccionario que probar), y así se compara
 * directamente con la columna solicitud_ayuda.titular_hash.
 */
export class LlavesSolicitudAyudaAleatorias implements LlavesSolicitudAyuda {
  nueva(): LlaveSolicitud {
    const llave = randomBytes(32).toString('base64url');
    return { llave, huella: huella(llave) };
  }

  huellaDe(llave: string): string | null {
    return FORMATO_LLAVE.test(llave) ? huella(llave) : null;
  }
}

function huella(llave: string): string {
  return createHash('sha256').update(llave).digest('hex');
}
