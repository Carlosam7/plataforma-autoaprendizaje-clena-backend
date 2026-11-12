import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import { CrearPersonalUseCase } from '../../application/personal/crear-personal.use-case.js';
import { DesactivarPersonalUseCase } from '../../application/personal/desactivar-personal.use-case.js';
import { EditarPersonalUseCase } from '../../application/personal/editar-personal.use-case.js';
import { ListarPersonalUseCase } from '../../application/personal/listar-personal.use-case.js';
import { ObtenerPersonalUseCase } from '../../application/personal/obtener-personal.use-case.js';
import { ReactivarPersonalUseCase } from '../../application/personal/reactivar-personal.use-case.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import { UsuarioActual } from '../shared/usuario-actual.decorator.js';
import { CrearPersonalDto } from './dto/crear-personal.dto.js';
import { EditarPersonalDto } from './dto/editar-personal.dto.js';
import { ListarPersonalDto } from './dto/listar-personal.dto.js';
import {
  PersonalDto,
  PersonalPaginadoDto,
} from './dto/personal.response.dto.js';

const uuid = new ParseUUIDPipe({ version: '4' });

/** HU-04: gestión de las cuentas del personal del CLENA. Solo administradores. */
@ApiTags('Personal')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'Sin sesión' })
@ApiForbiddenResponse({
  type: RespuestaErrorDto,
  description: 'No es administrador',
})
@Roles('ADMINISTRADOR')
@Controller('personal')
export class PersonalController {
  constructor(
    private readonly crearPersonal: CrearPersonalUseCase,
    private readonly listarPersonal: ListarPersonalUseCase,
    private readonly obtenerPersonal: ObtenerPersonalUseCase,
    private readonly editarPersonal: EditarPersonalUseCase,
    private readonly desactivarPersonal: DesactivarPersonalUseCase,
    private readonly reactivarPersonal: ReactivarPersonalUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una cuenta del personal (HU-04)',
    description:
      'La cuenta queda activa y con contraseña temporal, que su dueño debe cambiar en el primer ingreso.',
  })
  @ApiCreatedResponse({ type: PersonalDto })
  @ApiBadRequestResponse({ type: RespuestaErrorDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Correo en uso',
  })
  crear(
    @Body() dto: CrearPersonalDto,
    @UsuarioActual() admin: UsuarioAutenticado,
  ): Promise<PersonalDto> {
    return this.crearPersonal.ejecutar(dto, admin.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar las cuentas del personal (HU-04)' })
  @ApiOkResponse({ type: PersonalPaginadoDto })
  listar(@Query() criterio: ListarPersonalDto): Promise<PersonalPaginadoDto> {
    return this.listarPersonal.ejecutar(criterio);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una cuenta del personal (HU-04)' })
  @ApiOkResponse({ type: PersonalDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  obtener(@Param('id', uuid) id: string): Promise<PersonalDto> {
    return this.obtenerPersonal.ejecutar(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar nombre, correo o rol (HU-04)' })
  @ApiOkResponse({ type: PersonalDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Correo en uso',
  })
  editar(
    @Param('id', uuid) id: string,
    @Body() dto: EditarPersonalDto,
    @UsuarioActual() admin: UsuarioAutenticado,
  ): Promise<PersonalDto> {
    return this.editarPersonal.ejecutar(id, dto, admin.id);
  }

  @Post(':id/desactivar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar una cuenta (HU-04)',
    description:
      'Ya no puede iniciar sesión y sus sesiones abiertas se cierran. Sus registros históricos se conservan.',
  })
  @ApiOkResponse({ type: PersonalDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  desactivar(
    @Param('id', uuid) id: string,
    @UsuarioActual() admin: UsuarioAutenticado,
  ): Promise<PersonalDto> {
    return this.desactivarPersonal.ejecutar(id, admin.id);
  }

  @Post(':id/reactivar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivar una cuenta desactivada (HU-04)' })
  @ApiOkResponse({ type: PersonalDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  reactivar(@Param('id', uuid) id: string): Promise<PersonalDto> {
    return this.reactivarPersonal.ejecutar(id);
  }
}
