import { Correo } from '../../domain/auth/value-objects/correo.js';
import { NombrePersona } from '../../domain/auth/value-objects/nombre-persona.js';
import { CorreoPersonalEnUsoError } from '../../domain/personal/errores.js';
import { RolPersonal } from '../../domain/personal/personal.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import { buscarPersonalOFallar } from './buscar-personal.js';
import { aResumen, PersonalResumen } from './personal-resumen.js';

export interface EditarPersonalEntrada {
  nombre?: string;
  correo?: string;
  rol?: RolPersonal;
}

export class EditarPersonalUseCase {
  constructor(private readonly personal: PersonalRepository) {}

  async ejecutar(
    id: string,
    entrada: EditarPersonalEntrada,
    administradorId: string,
  ): Promise<PersonalResumen> {
    const cuenta = await buscarPersonalOFallar(this.personal, id);
    const nombre =
      entrada.nombre === undefined
        ? undefined
        : NombrePersona.crear(entrada.nombre);
    const correo =
      entrada.correo === undefined ? undefined : Correo.crear(entrada.correo);

    if (correo && (await this.personal.existeCorreo(correo, id))) {
      throw new CorreoPersonalEnUsoError();
    }

    cuenta.editar({ nombre, correo, rol: entrada.rol }, administradorId);
    await this.personal.actualizar(cuenta);
    return aResumen(cuenta);
  }
}
