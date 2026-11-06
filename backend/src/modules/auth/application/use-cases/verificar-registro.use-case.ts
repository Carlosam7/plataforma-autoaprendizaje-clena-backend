import { GeneradorId } from '../../../../shared/application/generador-id.port.js';
import { Reloj } from '../../../../shared/application/reloj.port.js';
import {
  CodigoIncorrectoError,
  RegistroNoEncontradoError,
} from '../../domain/errores.js';
import { RegistroPendienteRepository } from '../../domain/repositories/registro-pendiente.repository.js';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository.js';
import { Rol } from '../../domain/tipos.js';
import { ConfiguracionRegistro } from '../configuracion-registro.js';
import { HasherCodigo } from '../ports/codigo-verificacion.port.js';
import { EmisorSesion, SesionEmitida } from '../ports/emisor-sesion.port.js';

export interface UsuarioRegistradoResultado {
  usuario: { id: string; nombre: string; rol: Rol };
  sesion: SesionEmitida;
}

/**
 * HU-01, paso 2: valida el código, crea la cuenta con rol de usuario público
 * y deja la sesión iniciada.
 */
export class VerificarRegistroUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly registros: RegistroPendienteRepository,
    private readonly hasher: HasherCodigo,
    private readonly emisorSesion: EmisorSesion,
    private readonly generadorId: GeneradorId,
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

    // Si entre la solicitud y la verificación otra cuenta tomó estos datos,
    // el repositorio lanza el error de conflicto correspondiente.
    const usuario = registro.confirmar(this.generadorId.generar(), ahora);
    await this.usuarios.crear(usuario);
    await this.registros.eliminar(registro.id);

    const sesion = await this.emisorSesion.iniciar({
      id: usuario.id,
      rol: usuario.rol,
    });
    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre.valor,
        rol: usuario.rol,
      },
      sesion,
    };
  }
}
