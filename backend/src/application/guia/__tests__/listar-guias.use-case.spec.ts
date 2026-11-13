import { describe, expect, it } from 'vitest';
import { Guia } from '../../../domain/guia/guia.js';
import {
  CriterioGuiasPublicadas,
  GuiaRepository,
} from '../../../domain/guia/guia.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { ListarGuiasUseCase } from '../listar-guias.use-case.js';

class RepoFalso extends GuiaRepository {
  recibido?: CriterioGuiasPublicadas;
  constructor(private readonly guias: Guia[]) {
    super();
  }
  listarPublicadas(criterio: CriterioGuiasPublicadas): Promise<Pagina<Guia>> {
    this.recibido = criterio;
    return Promise.resolve({ elementos: this.guias, total: this.guias.length });
  }
  buscarPublicada(): Promise<null> {
    return Promise.resolve(null);
  }
  buscarIdPublicada(): Promise<null> {
    return Promise.resolve(null);
  }
}

const criterio: CriterioGuiasPublicadas = {
  categoria: 'seguridad-digital',
  ordenarPor: 'titulo',
  direccion: 'asc',
  pagina: 1,
  limite: 20,
};

describe('HU-09 · ListarGuiasUseCase', () => {
  it('pasa el criterio al repositorio y devuelve título, nivel y duración sin id ni estado', async () => {
    const repo = new RepoFalso([
      new Guia(
        'uuid-1',
        'smishing',
        'seguridad-digital',
        'Mensajes de texto falsos',
        'Al terminar sabrás reconocer un SMS falso.',
        'BASICO',
        8,
        'PUBLICADA',
      ),
    ]);

    const resultado = await new ListarGuiasUseCase(repo).ejecutar(criterio);

    expect(repo.recibido).toEqual(criterio);
    expect(resultado).toEqual({
      datos: [
        {
          slug: 'smishing',
          categoria: 'seguridad-digital',
          titulo: 'Mensajes de texto falsos',
          objetivo: 'Al terminar sabrás reconocer un SMS falso.',
          nivel: 'BASICO',
          duracionEstimadaMin: 8,
        },
      ],
      total: 1,
      pagina: 1,
      limite: 20,
    });
  });

  it('una categoría sin guías publicadas devuelve la lista vacía', async () => {
    const resultado = await new ListarGuiasUseCase(new RepoFalso([])).ejecutar(
      criterio,
    );
    expect(resultado).toEqual({ datos: [], total: 0, pagina: 1, limite: 20 });
  });
});
