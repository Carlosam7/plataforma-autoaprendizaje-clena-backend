import {
  CriterioPersonal,
  PersonalRepository,
} from '../../domain/personal/personal.repository.js';
import { ResultadoPaginado } from '../shared/resultado-paginado.js';
import { aResumen, PersonalResumen } from './personal-resumen.js';

export class ListarPersonalUseCase {
  constructor(private readonly personal: PersonalRepository) {}

  async ejecutar(
    criterio: CriterioPersonal,
  ): Promise<ResultadoPaginado<PersonalResumen>> {
    const { elementos, total } = await this.personal.listar(criterio);
    return {
      datos: elementos.map(aResumen),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
