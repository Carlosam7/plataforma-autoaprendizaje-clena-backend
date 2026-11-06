import { DatoInvalidoError } from '../../../../shared/domain/error-de-negocio.js';

export class NombrePersona {
  private constructor(readonly valor: string) {}

  static crear(valor: string): NombrePersona {
    const normalizado = valor.trim().replace(/\s+/g, ' ');
    if (normalizado.length < 2 || normalizado.length > 100) {
      throw new DatoInvalidoError(
        'nombre',
        'Escribe tu nombre, entre 2 y 100 letras.',
      );
    }
    return new NombrePersona(normalizado);
  }
}
