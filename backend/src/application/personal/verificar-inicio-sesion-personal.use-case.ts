import {
  CodigoIncorrectoError,
  IntentosAgotadosError,
  SolicitudInicioSesionNoEncontradaError,
} from '../../domain/auth/errores.js';
import { CodigoPersonalRepository } from '../../domain/personal/codigo-personal.repository.js';
import { RolPersonal } from '../../domain/personal/personal.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import { HasherCodigo } from '../auth/codigo-verificacion.port.js';
import { EmisorSesion, SesionEmitida } from '../auth/emisor-sesion.port.js';
import { Reloj } from '../shared/reloj.port.js';
import { ConfiguracionPersonal } from './configuracion-personal.js';

export interface SesionPersonalIniciada {
  usuario: {
    nombre: string;
    rol: RolPersonal;
    /** true si todavía tiene la contraseña temporal: el frontend lo lleva a cambiarla (HU-04). */
    debeCambiarPassword: boolean;
  };
  sesion: SesionEmitida;
}

/** HU-06, paso 2: valida el código del correo y abre la sesión (access token + refresh token). */
export class VerificarInicioSesionPersonalUseCase {
  constructor(
    private readonly personal: PersonalRepository,
    private readonly codigos: CodigoPersonalRepository,
    private readonly hasherCodigo: HasherCodigo,
    private readonly emisorSesion: EmisorSesion,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionPersonal,
  ) {}

  async ejecutar(comando: {
    solicitudId: string;
    codigo: string;
  }): Promise<SesionPersonalIniciada> {
    const ahora = this.reloj.ahora();
    const politica = this.config.politicaCodigo;

    const cuenta = await this.personal.buscarPorId(comando.solicitudId);
    // Una cuenta desactivada entre los dos pasos ya no puede entrar.
    const codigo = cuenta?.activo
      ? await this.codigos.ultimoSinUsar(cuenta.id, 'INICIO_SESION')
      : null;
    if (!cuenta || !codigo) throw new SolicitudInicioSesionNoEncontradaError();

    codigo.asegurarUtilizable(ahora, politica);
    // Se reserva el intento antes de comparar: así, con peticiones en paralelo, solo
    // maxIntentos llegan a probar un código.
    if (
      !(await this.codigos.reservarIntento(codigo.id, politica.maxIntentos))
    ) {
      throw new IntentosAgotadosError();
    }
    if (
      !(await this.hasherCodigo.coincide(
        comando.codigo.trim(),
        codigo.codigoHash,
      ))
    ) {
      throw new CodigoIncorrectoError(codigo.registrarIntentoFallido(politica));
    }

    codigo.marcarUsado(ahora);
    cuenta.registrarAcceso(ahora);
    await this.codigos.actualizar(codigo);
    await this.personal.actualizar(cuenta);

    const sesion = await this.emisorSesion.iniciar({
      id: cuenta.id,
      rol: cuenta.rol,
    });
    return {
      usuario: {
        nombre: cuenta.nombre.valor,
        rol: cuenta.rol,
        debeCambiarPassword: cuenta.debeCambiarPassword,
      },
      sesion,
    };
  }
}
