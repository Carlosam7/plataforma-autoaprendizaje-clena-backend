import { Rol } from '../../domain/auth/tipos.js';
import { ConsultaGuiaRepository } from '../../domain/guia/consulta-guia.repository.js';
import { GuiaNoEncontradaError } from '../../domain/guia/errores.js';
import { GuiaRepository } from '../../domain/guia/guia.repository.js';
import { Reloj } from '../shared/reloj.port.js';

/**
 * HU-10: registra que alguien abrió una guía, para las estadísticas del panel (HU-31).
 * Solo se asocia al usuario público con sesión; sin sesión, o si es del personal, queda anónima.
 */
export class RegistrarConsultaGuiaUseCase {
  constructor(
    private readonly guias: GuiaRepository,
    private readonly consultas: ConsultaGuiaRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    slug: string,
    usuario: { id: string; rol: Rol } | null,
  ): Promise<void> {
    const guiaId = await this.guias.buscarIdPublicada(slug);
    if (!guiaId) throw new GuiaNoEncontradaError();

    await this.consultas.registrar({
      guiaId,
      // consulta_guia.usuario_id apunta a usuario_publico: el personal no se registra.
      usuarioId: usuario?.rol === 'USUARIO_PUBLICO' ? usuario.id : null,
      consultadaEn: this.reloj.ahora(),
    });
  }
}
