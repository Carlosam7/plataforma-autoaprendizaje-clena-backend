import { Correo } from '../../domain/auth/value-objects/correo.js';
import { NombrePersona } from '../../domain/auth/value-objects/nombre-persona.js';
import { CorreoPersonalEnUsoError } from '../../domain/personal/errores.js';
import { Password } from '../../domain/personal/password.js';
import { Personal, RolPersonal } from '../../domain/personal/personal.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import { HasherPassword } from './hasher-password.port.js';
import { aResumen, PersonalResumen } from './personal-resumen.js';

export interface CrearPersonalEntrada {
  nombre: string;
  correo: string;
  passwordTemporal: string;
  rol: RolPersonal;
}

/** HU-04: un administrador crea la cuenta de un monitor con una contraseña temporal. */
export class CrearPersonalUseCase {
  constructor(
    private readonly personal: PersonalRepository,
    private readonly hasher: HasherPassword,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    entrada: CrearPersonalEntrada,
    administradorId: string,
  ): Promise<PersonalResumen> {
    const nombre = NombrePersona.crear(entrada.nombre);
    const correo = Correo.crear(entrada.correo);
    const password = Password.crear(
      entrada.passwordTemporal,
      'passwordTemporal',
    );

    if (await this.personal.existeCorreo(correo)) {
      throw new CorreoPersonalEnUsoError();
    }

    const nuevo = Personal.crear({
      id: this.generadorId.generar(),
      nombre,
      correo,
      rol: entrada.rol,
      passwordHash: await this.hasher.hash(password.valor),
      creadoPorId: administradorId,
      ahora: this.reloj.ahora(),
    });
    await this.personal.crear(nuevo);
    return aResumen(nuevo);
  }
}
