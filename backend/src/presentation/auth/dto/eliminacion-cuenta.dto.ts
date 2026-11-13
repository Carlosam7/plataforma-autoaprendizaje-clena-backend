import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';
import type { ConfirmarEliminacionCuentaComando } from '../../../application/auth/confirmar-eliminacion-cuenta.use-case.js';
import type { EliminacionSolicitada } from '../../../application/auth/solicitar-eliminacion-cuenta.use-case.js';
import type { CanalVerificacion } from '../../../domain/auth/tipos.js';

const CANALES = ['CORREO', 'TELEFONO'] as const;

export class SolicitarEliminacionCuentaDto {
  @ApiPropertyOptional({
    enum: CANALES,
    description:
      'Por dónde recibir el código. Sin él: por correo si la cuenta tiene uno confirmado; si no, por mensaje de texto.',
  })
  @IsOptional()
  @IsIn(CANALES, {
    message: 'Elige recibir el código por correo o por mensaje de texto.',
  })
  canal?: CanalVerificacion;
}

export class ConfirmarEliminacionCuentaDto implements ConfirmarEliminacionCuentaComando {
  @ApiProperty({
    format: 'uuid',
    description: 'El que devolvió POST /auth/cuenta/eliminacion',
  })
  @IsUUID('all', {
    message:
      'La solicitud para eliminar la cuenta no es válida. Pide un código nuevo.',
  })
  solicitudId!: string;

  @ApiProperty({ example: '483920' })
  @Matches(/^\s*\d{6}\s*$/, { message: 'El código tiene 6 números.' })
  codigo!: string;
}

export class EliminacionSolicitadaDto implements EliminacionSolicitada {
  @ApiProperty({
    format: 'uuid',
    description: 'Se envía al confirmar con el código',
  })
  solicitudId!: string;

  @ApiProperty({ enum: CANALES })
  canal!: CanalVerificacion;

  @ApiProperty({
    example: 'c****@correo.com',
    description: 'Destino enmascarado',
  })
  destino!: string;

  @ApiProperty({
    example:
      'Te enviamos un código a c****@correo.com. Escríbelo para confirmar que quieres eliminar tu cuenta.',
  })
  mensaje!: string;

  @ApiProperty()
  expiraEn!: Date;

  @ApiProperty()
  puedeReenviarEn!: Date;
}
