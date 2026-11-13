import { ApiProperty } from '@nestjs/swagger';
import type {
  ActividadMostrada,
  PreguntaMostrada,
} from '../../../application/practica/obtener-actividad.use-case.js';
import type { IntentoIniciado } from '../../../application/practica/iniciar-intento.use-case.js';
import type { RespuestaResultado } from '../../../application/practica/responder-pregunta.use-case.js';
import type { Calificacion } from '../../../domain/practica/intento.js';

// Solo documentan en Swagger la salida de los casos de uso.
class OpcionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'No lo abro y borro el mensaje' })
  texto!: string;
}

class PreguntaDto implements PreguntaMostrada {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example:
      'Te llega un SMS: «Tu cuenta será bloqueada hoy, entra aquí». ¿Qué haces?',
  })
  enunciado!: string;

  @ApiProperty({
    type: [OpcionDto],
    description: 'En orden. No dice cuál es la correcta.',
  })
  opciones!: OpcionDto[];
}

export class ActividadDto implements ActividadMostrada {
  @ApiProperty({ example: 'Practica: mensajes falsos por SMS' })
  titulo!: string;

  @ApiProperty({ example: 70, description: 'Porcentaje mínimo para aprobar' })
  porcentajeAprobacion!: number;

  @ApiProperty({ example: 4, description: 'Para mostrar «Pregunta 1 de N»' })
  totalPreguntas!: number;

  @ApiProperty({
    type: [PreguntaDto],
    description: 'En el orden en que se muestran',
  })
  preguntas!: PreguntaDto[];
}

export class IntentoIniciadoDto implements IntentoIniciado {
  @ApiProperty({
    format: 'uuid',
    description: 'Se usa para enviar cada respuesta.',
  })
  id!: string;

  @ApiProperty({ example: 4 })
  totalPreguntas!: number;
}

class CalificacionDto implements Calificacion {
  @ApiProperty({ example: 3 })
  respuestasCorrectas!: number;

  @ApiProperty({ example: 4 })
  totalPreguntas!: number;

  @ApiProperty({ example: 75 })
  porcentaje!: number;

  @ApiProperty({ example: true })
  aprobado!: boolean;

  @ApiProperty({ example: 70 })
  porcentajeAprobacion!: number;
}

export class RespuestaResultadoDto implements RespuestaResultado {
  @ApiProperty({
    description: 'El frontend lo muestra con texto e ícono, no solo con color.',
  })
  esCorrecta!: boolean;

  @ApiProperty({
    type: OpcionDto,
    description: 'Para «Casi. La respuesta correcta es…»',
  })
  opcionCorrecta!: OpcionDto;

  @ApiProperty({
    example: 'Los bancos no te piden entrar a enlaces por mensaje de texto.',
  })
  explicacion!: string;

  @ApiProperty({ example: 4 })
  respondidas!: number;

  @ApiProperty({ example: 4 })
  totalPreguntas!: number;

  @ApiProperty({
    type: CalificacionDto,
    nullable: true,
    description:
      'Solo al responder la última pregunta; antes es null. Si no aprobó, se puede repetir empezando otro intento.',
  })
  resultado!: Calificacion | null;
}
