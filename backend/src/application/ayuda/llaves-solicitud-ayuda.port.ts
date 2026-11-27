/**
 * Llave del navegador que pide ayuda (C-05): un secreto opaco que viaja en una cookie
 * httpOnly y demuestra que ese navegador pidió la solicitud. Se guarda solo su huella, así
 * que quien lea la base de datos no puede hacerse pasar por el visitante.
 */
export interface LlaveSolicitud {
  llave: string;
  huella: string;
}

export abstract class LlavesSolicitudAyuda {
  /** Una llave nueva, imposible de adivinar, con su huella. */
  abstract nueva(): LlaveSolicitud;

  /** La huella de una llave recibida; null si no tiene el formato de una llave. */
  abstract huellaDe(llave: string): string | null;
}
