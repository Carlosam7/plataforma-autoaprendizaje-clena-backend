import { describe, expect, it } from 'vitest';
import { Categoria } from '../../../domain/categoria/categoria.js';
import {
  CategoriaRepository,
  CriterioCategorias,
} from '../../../domain/categoria/categoria.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { ListarCategoriasUseCase } from '../listar-categorias.use-case.js';

class RepoFalso extends CategoriaRepository {
  recibido?: CriterioCategorias;
  listar(criterio: CriterioCategorias): Promise<Pagina<Categoria>> {
    this.recibido = criterio;
    return Promise.resolve({
      elementos: [new Categoria(1, 'correo', 'Correo', 'mail', 1)],
      total: 5,
    });
  }
}

describe('ListarCategoriasUseCase', () => {
  it('pasa el criterio al repositorio y devuelve DTOs sin id ni orden', async () => {
    const repo = new RepoFalso();
    const criterio: CriterioCategorias = {
      q: 'corr',
      ordenarPor: 'nombre',
      direccion: 'desc',
      pagina: 2,
      limite: 1,
    };

    const resultado = await new ListarCategoriasUseCase(repo).ejecutar(
      criterio,
    );

    expect(repo.recibido).toEqual(criterio);
    expect(resultado).toEqual({
      datos: [{ slug: 'correo', nombre: 'Correo', icono: 'mail' }],
      total: 5,
      pagina: 2,
      limite: 1,
    });
  });
});
