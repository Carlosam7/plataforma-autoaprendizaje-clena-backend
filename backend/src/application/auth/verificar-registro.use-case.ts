import {
  CodigoIncorrectoError,
  RegistroNoEncontradoError,
} from '../../domain/auth/errores.js';
import { RegistroPendienteRepository } from '../../domain/auth/registro-pendiente.repository.js';
import { Rol } from '../../domain/auth/tipos.js';
import { Reloj } from '../shared/reloj.port.js';
import { HasherCodigo } from './codigo-verificacion.port.js';
import { ConfiguracionRegistro } from './configuracion-registro.js';
import { EmisorSesion, SesionEmitida } from './emisor-sesion.port.js';

export interface UsuarioRegistradoResultado {
  // Sin identificador: es la cédula y el frontend no la necesita (datos mínimos, Ley 1581).
  usuario: { nombre: string; rol: Rol };
  sesion: SesionEmitida;
}

/**
 * HU-01, paso 2: valida el código, deja activa la cuenta con rol de usuario público
 * y la sesión iniciada.
 */
export class VerificarRegistroUseCase {
  constructor(
    private readonly registros: RegistroPendienteRepository,
    private readonly hasher: HasherCodigo,
    private readonly emisorSesion: EmisorSesion,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionRegistro,
  ) {}

  async ejecutar(comando: {
    registroId: string;
    codigo: string;
  }): Promise<UsuarioRegistradoResultado> {
    const ahora = this.reloj.ahora();
    const { politicaCodigo } = this.config;

    const registro = await this.registros.buscarPorId(comando.registroId);
    if (!registro) throw new RegistroNoEncontradoError();

    registro.asegurarCodigoUtilizable(ahora, politicaCodigo);

    if (
      !(await this.hasher.coincide(comando.codigo.trim(), registro.codigoHash))
    ) {
      const restantes = registro.registrarIntentoFallido(politicaCodigo);
      await this.registros.guardar(registro);
      throw new CodigoIncorrectoError(restantes);
    }

    const usuario = registro.confirmar();
    await this.registros.confirmar(registro, ahora);

    const sesion = await this.emisorSesion.iniciar({
      id: usuario.id,
      rol: usuario.rol,
    });
    return {
      usuario: {
        nombre: usuario.nombre.valor,
        rol: usuario.rol,
      },
      sesion,
    };
  }
}
