import { ApiProperty } from '@nestjs/swagger';
import { CodigoPasswordEnviado } from '../../../application/personal/solicitar-codigo-password-inicial.use-case.js';
import { PersonalResumen } from '../../../application/personal/personal-resumen.js';
import { ResultadoPaginado } from '../../../application/shared/resultado-paginado.js';
import { ROLES_PERSONAL } from '../../../domain/personal/personal.js';
import type { RolPersonal } from '../../../domain/personal/personal.js';
import { PaginaDto } from '../../shared/paginacion.dto.js';

export class PersonalDto implements PersonalResumen {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Luis Pérez' })
  nombre!: string;

  @ApiProperty({ example: 'luis.perez@clena.org' })
  correo!: string;

  @ApiProperty({ enum: ROLES_PERSONAL })
  rol!: RolPersonal;

  @ApiProperty()
  activo!: boolean;

  @ApiProperty({ description: 'true mientras conserve la contraseña temporal' })
  debeCambiarPassword!: boolean;

  @ApiProperty({ type: Date, nullable: true })
  ultimoAccesoEn!: Date | null;

  @ApiProperty()
  creadoEn!: Date;
}

export class PersonalPaginadoDto
  extends PaginaDto
  implements ResultadoPaginado<PersonalResumen>
{
  @ApiProperty({ type: [PersonalDto] })
  datos!: PersonalDto[];
}

export class CodigoPasswordEnviadoDto implements CodigoPasswordEnviado {
  @ApiProperty({ example: 'l****@clena.org' })
  destino!: string;

  @ApiProperty()
  expiraEn!: Date;

  @ApiProperty({ example: 'Te enviamos un código a l****@clena.org.' })
  mensaje!: string;
}
