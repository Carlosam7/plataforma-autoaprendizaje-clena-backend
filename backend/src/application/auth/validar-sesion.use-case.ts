import { SesionInvalidaError } from '../../domain/auth/errores.js';
import { SesionRepository } from '../../domain/auth/sesion.repository.js';
import { Rol } from '../../domain/auth/tipos.js';
import { Reloj } from '../shared/reloj.port.js';
import { VerificadorAccessToken } from './verificador-access-token.port.js';

export interface UsuarioAutenticado {
  id: string;
  rol: Rol;
  sesionId: string;
}

/**
 * Convierte un access token en el usuario que hace la petición.
 * Además de la firma, revisa la sesión en la base de datos: un token firmado deja de
 * servir si se cerró la sesión o se desactivó la cuenta del personal.
 */
export class ValidarSesionUseCase {
  constructor(
    private readonly verificador: VerificadorAccessToken,
    private readonly sesiones: SesionRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(accessToken: string): Promise<UsuarioAutenticado> {
    const contenido = await this.verificador.verificar(accessToken);
    if (!contenido) throw new SesionInvalidaError();

    const sesion = await this.sesiones.buscarActiva(
      contenido.sid,
      this.reloj.ahora(),
    );
    if (!sesion) throw new SesionInvalidaError();

    return { id: sesion.usuarioId, rol: sesion.rol, sesionId: sesion.sesionId };
  }
}
