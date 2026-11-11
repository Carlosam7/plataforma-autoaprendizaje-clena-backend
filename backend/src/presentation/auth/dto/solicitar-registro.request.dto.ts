import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// El DTO solo valida tipos y forma; las reglas de cada dato (formato de celular, correo,
// identificación, fecha) viven en los objetos de valor del dominio.
export class SolicitarRegistroRequestDto {
  @ApiProperty({ example: 'Carmen Rodríguez' })
  @IsString({ message: 'Escribe tu nombre.' })
  @MaxLength(100, { message: 'El nombre puede tener máximo 100 letras.' })
  nombre: string;

  @ApiProperty({
    example: '41234567',
    description: 'Cédula, cédula de extranjería o pasaporte',
  })
  @IsString({ message: 'Escribe tu número de identificación.' })
  @MaxLength(30, { message: 'El número de identificación es demasiado largo.' })
  numeroIdentificacion: string;

  @ApiProperty({ example: '1955-08-21', description: 'Formato AAAA-MM-DD' })
  @IsString({ message: 'Escribe tu fecha de nacimiento.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message:
      'Escribe tu fecha de nacimiento con el formato año-mes-día, por ejemplo 1955-08-21.',
  })
  fechaNacimiento: string;

  @ApiPropertyOptional({
    example: '300 123 4567',
    description: 'Celular colombiano. Obligatorio si no hay correo',
  })
  @IsOptional()
  @IsString({ message: 'Escribe tu número de celular.' })
  @MaxLength(20, { message: 'El número de celular es demasiado largo.' })
  telefono?: string;

  @ApiPropertyOptional({
    example: 'carmen@correo.com',
    description: 'Obligatorio si no hay teléfono',
  })
  @IsOptional()
  @IsString({ message: 'Escribe tu correo.' })
  @MaxLength(254, { message: 'El correo es demasiado largo.' })
  correo?: string;

  @ApiProperty({
    example: true,
    description: 'Debe ser true: aceptación del aviso de privacidad (Ley 1581)',
  })
  @IsBoolean({ message: 'Indica si aceptas el aviso de privacidad.' })
  aceptaAvisoPrivacidad: boolean;

  @ApiPropertyOptional({
    enum: ['CORREO', 'TELEFONO'],
    description:
      'Por dónde recibir el código. Si no se indica, se usa el correo y, si no hay, el celular',
  })
  @IsOptional()
  @IsIn(['CORREO', 'TELEFONO'], {
    message: 'Elige recibir el código por correo o por mensaje de texto.',
  })
  canalVerificacion?: 'CORREO' | 'TELEFONO';
}
