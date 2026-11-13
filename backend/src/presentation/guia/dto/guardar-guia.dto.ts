import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { GuardarGuiaComando } from '../../../application/guia/crear-guia.use-case.js';
import {
  NIVELES_AVISO,
  type NivelAviso,
} from '../../../domain/guia/contenido-paso.js';
import type { PasoEntrada } from '../../../domain/guia/guia-editable.js';
import { NIVELES_GUIA, type NivelGuia } from '../../../domain/guia/guia.js';

// Solo documenta en Swagger la forma de un bloque; el dominio (ContenidoPaso) lo valida.
class BloqueEntradaDto {
  @ApiProperty({ enum: ['texto', 'imagen', 'aviso'] })
  tipo!: 'texto' | 'imagen' | 'aviso';

  @ApiPropertyOptional({
    description:
      'Tipos texto y aviso. Máximo 600 letras; lo ideal, tres oraciones.',
    example: 'Abre el correo y toca «Redactar».',
  })
  texto?: string;

  @ApiPropertyOptional({ description: 'Tipo aviso', enum: NIVELES_AVISO })
  nivel?: NivelAviso;

  @ApiPropertyOptional({
    description: 'Tipo imagen: id de una imagen que ya existe',
    format: 'uuid',
  })
  imagenId?: string;

  @ApiPropertyOptional({
    description: 'Tipo imagen: qué muestra, para lectores de pantalla',
    example: 'Botón «Redactar» en la esquina de la pantalla',
  })
  textoAlternativo?: string;
}

class PasoEntradaDto implements PasoEntrada {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'El id del paso si ya existía (así conserva el progreso de quienes lo leyeron). Sin id, es un paso nuevo.',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Uno de los pasos no es válido.' })
  id?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Abre el correo',
  })
  @IsOptional()
  @IsString({ message: 'El título del paso debe ser un texto.' })
  @MaxLength(120, {
    message: 'El título de un paso puede tener máximo 120 letras.',
  })
  titulo?: string | null;

  @ApiProperty({
    type: [BloqueEntradaDto],
    description: 'Entre 1 y 10, en el orden en que se muestran',
  })
  @IsArray({ message: 'Cada paso necesita su lista de bloques.' })
  @ArrayMaxSize(10, { message: 'Un paso puede tener máximo 10 bloques.' })
  bloques!: object[];
}

export class GuardarGuiaDto {
  @ApiProperty({ example: 'Enviar un correo electrónico' })
  @IsString({ message: 'Escribe el título de la guía.' })
  @IsNotEmpty({ message: 'Escribe el título de la guía.' })
  @MaxLength(150, { message: 'El título puede tener máximo 150 letras.' })
  titulo!: string;

  @ApiProperty({
    example: 'Al terminar sabrás enviar un correo con un archivo.',
  })
  @IsString({ message: 'Escribe el objetivo de la guía.' })
  @IsNotEmpty({ message: 'Escribe el objetivo de la guía.' })
  @MaxLength(300, { message: 'El objetivo puede tener máximo 300 letras.' })
  objetivo!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto.' })
  @MaxLength(2000, {
    message: 'La descripción puede tener máximo 2000 letras.',
  })
  descripcion?: string | null;

  @ApiProperty({
    example: 'correo-electronico',
    description: 'Slug de la categoría (GET /categorias)',
  })
  @IsString({ message: 'Elige una categoría de la lista.' })
  @IsNotEmpty({ message: 'Elige una categoría de la lista.' })
  @MaxLength(40, { message: 'Elige una categoría de la lista.' })
  categoria!: string;

  @ApiProperty({ enum: NIVELES_GUIA })
  @IsIn(NIVELES_GUIA, { message: 'Elige un nivel de la lista.' })
  nivel!: NivelGuia;

  @ApiProperty({ example: 10, description: 'En minutos, entre 1 y 600' })
  @IsInt({ message: 'La duración debe ser un número entero de minutos.' })
  @Min(1, { message: 'La duración debe ser de al menos 1 minuto.' })
  @Max(600, { message: 'La duración puede ser máximo de 600 minutos.' })
  duracionEstimadaMin!: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['email', 'gmail', 'adjuntar'],
    description:
      'Palabras con las que la gente buscaría la guía (HU-11). Máximo 15.',
  })
  @IsOptional()
  @IsArray({ message: 'Las palabras clave deben ser una lista.' })
  @ArrayMaxSize(15, { message: 'Escribe máximo 15 palabras clave.' })
  @IsString({ each: true, message: 'Cada palabra clave debe ser un texto.' })
  @MaxLength(40, {
    each: true,
    message: 'Cada palabra clave puede tener máximo 40 letras.',
  })
  palabrasClave?: string[];

  @ApiPropertyOptional({
    type: [PasoEntradaDto],
    description:
      'Los pasos en el orden en que se muestran. Al editar: si no se envía, los pasos no se tocan; si se envía, quedan exactamente estos (se agregan, cambian, quitan y reordenan de una vez).',
  })
  @IsOptional()
  @IsArray({ message: 'Los pasos deben ser una lista.' })
  @ArrayMaxSize(50, { message: 'Una guía puede tener máximo 50 pasos.' })
  @ValidateNested({ each: true })
  @Type(() => PasoEntradaDto)
  pasos?: PasoEntradaDto[];

  aComando(): GuardarGuiaComando {
    return {
      titulo: this.titulo,
      objetivo: this.objetivo,
      descripcion: this.descripcion ?? null,
      categoriaSlug: this.categoria,
      nivel: this.nivel,
      duracionEstimadaMin: this.duracionEstimadaMin,
      palabrasClave: this.palabrasClave ?? [],
      pasos: this.pasos,
    };
  }
}
