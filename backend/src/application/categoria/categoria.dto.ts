import { ApiProperty } from '@nestjs/swagger';
import { Categoria } from '../../domain/categoria/categoria.js';
import { PaginaDto } from '../shared/paginacion.dto.js';

// Lo que la API expone de una categoría; id y orden son detalles internos.
export class CategoriaDto {
  @ApiProperty({ example: 'salud' })
  slug!: string;

  @ApiProperty({ example: 'Salud' })
  nombre!: string;

  @ApiProperty({ example: 'heart' })
  icono!: string;

  static desde(categoria: Categoria): CategoriaDto {
    return {
      slug: categoria.slug,
      nombre: categoria.nombre,
      icono: categoria.icono,
    };
  }
}

export class CategoriasPaginadasDto extends PaginaDto {
  @ApiProperty({ type: [CategoriaDto] })
  datos!: CategoriaDto[];
}
