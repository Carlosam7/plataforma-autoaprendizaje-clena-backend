import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import type {
  CriterioResumen,
  ResumenEstadisticas,
} from '../../../application/estadistica/ver-resumen-estadisticas.use-case.js';
import {
  TEMAS_AYUDA,
  type TemaAyuda,
} from '../../../domain/ayuda/solicitud-ayuda.js';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class ResumenEstadisticasQueryDto implements CriterioResumen {
  @ApiPropertyOptional({
    example: '2026-11-20',
    description:
      'Primer día incluido (AAAA-MM-DD, hora de Bogotá). Sin él: 6 días antes de `hasta`.',
  })
  @IsOptional()
  @Matches(FECHA, {
    message: 'La fecha inicial debe tener el formato AAAA-MM-DD.',
  })
  desde?: string;

  @ApiPropertyOptional({
    example: '2026-11-26',
    description:
      'Último día incluido (AAAA-MM-DD, hora de Bogotá). Sin él: hoy.',
  })
  @IsOptional()
  @Matches(FECHA, {
    message: 'La fecha final debe tener el formato AAAA-MM-DD.',
  })
  hasta?: string;
}

// Solo documentan en Swagger la salida del caso de uso.

class PeriodoDto {
  @ApiProperty({ example: '2026-11-20' })
  desde!: string;

  @ApiProperty({ example: '2026-11-26' })
  hasta!: string;

  @ApiProperty({ example: 'America/Bogota' })
  zonaHoraria!: string;
}

class TotalesDto {
  @ApiProperty({
    example: 35,
    description: 'Aperturas de guías, con o sin cuenta',
  })
  consultasGuias!: number;

  @ApiProperty({ example: 6 })
  solicitudesAyuda!: number;
}

class ConsultasGuiaDto {
  @ApiProperty({ example: 'smishing' })
  slug!: string;

  @ApiProperty({ example: 'Smishing: mensajes de texto falsos' })
  titulo!: string;

  @ApiProperty({ example: 20 })
  consultas!: number;
}

class ConsultasCategoriaDto {
  @ApiProperty({ example: 'seguridad-digital' })
  slug!: string;

  @ApiProperty({ example: 'Seguridad digital' })
  nombre!: string;

  @ApiProperty({ example: 35 })
  consultas!: number;
}

class SolicitudesTemaDto {
  @ApiProperty({ enum: TEMAS_AYUDA, example: 'SEGURIDAD_DIGITAL' })
  tema!: TemaAyuda;

  @ApiProperty({ example: 6 })
  cantidad!: number;
}

export class ResumenEstadisticasDto implements ResumenEstadisticas {
  @ApiProperty({ type: PeriodoDto })
  periodo!: PeriodoDto;

  @ApiProperty({ type: TotalesDto })
  totales!: TotalesDto;

  @ApiProperty({
    type: [ConsultasGuiaDto],
    description:
      'Máximo 10, de más a menos consultas (empate: por slug). Incluye guías ocultas.',
  })
  topGuias!: ConsultasGuiaDto[];

  @ApiProperty({
    type: [ConsultasCategoriaDto],
    description:
      'Solo categorías con consultas; de más a menos (empate: por slug).',
  })
  consultasPorCategoria!: ConsultasCategoriaDto[];

  @ApiProperty({
    type: [SolicitudesTemaDto],
    description:
      'Solo temas con solicitudes; de más a menos (empate: por tema).',
  })
  solicitudesPorTema!: SolicitudesTemaDto[];

  @ApiProperty({
    example: true,
    description: 'false si no hubo consultas ni solicitudes en el periodo',
  })
  hayDatos!: boolean;
}
