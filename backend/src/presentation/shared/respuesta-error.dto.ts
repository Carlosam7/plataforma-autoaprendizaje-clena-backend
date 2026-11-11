import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Formato uniforme de todas las respuestas de error de la API. */
export class RespuestaErrorDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({
    example: 'TELEFONO_EN_USO',
    description: 'Código estable para que el frontend decida qué hacer',
  })
  codigo: string;

  @ApiProperty({
    example: 'Ese teléfono ya está en uso, prueba con otro',
    description: 'Texto para mostrar al usuario',
  })
  mensaje: string;

  @ApiPropertyOptional({
    description: 'Información adicional, por ejemplo los campos con errores',
  })
  detalles?: Record<string, unknown>;

  @ApiProperty({ example: '/api/v1/auth/registro' })
  ruta: string;

  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' })
  fecha: string;
}
