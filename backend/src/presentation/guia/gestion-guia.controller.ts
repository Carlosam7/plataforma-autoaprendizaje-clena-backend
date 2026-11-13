import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import {
  OcultarGuiaUseCase,
  PublicarGuiaUseCase,
} from '../../application/guia/cambiar-estado-guia.use-cases.js';
import {
  ListarGuiasGestionUseCase,
  ObtenerGuiaGestionUseCase,
} from '../../application/guia/consultar-guias-gestion.use-cases.js';
import { CrearGuiaUseCase } from '../../application/guia/crear-guia.use-case.js';
import { EditarGuiaUseCase } from '../../application/guia/editar-guia.use-case.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import { UsuarioActual } from '../shared/usuario-actual.decorator.js';
import { GuardarGuiaDto } from './dto/guardar-guia.dto.js';
import {
  GuiaGestionDetalleDto,
  GuiasGestionPaginadasDto,
} from './dto/guia-gestion.dto.js';
import { ListarGuiasGestionDto } from './dto/listar-guias-gestion.dto.js';
import { SlugGuiaDto } from './dto/slug-guia.dto.js';

/** HU-13, HU-15: el personal administra el catálogo. Las rutas públicas están en GuiaController. */
@ApiTags('gestion de guias')
@ApiBearerAuth()
@ApiBadRequestResponse({ type: RespuestaErrorDto })
@ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'Sin sesión' })
@ApiForbiddenResponse({
  type: RespuestaErrorDto,
  description: 'No es del personal',
})
@Roles('PERSONAL', 'ADMINISTRADOR')
@Controller('gestion/guias')
export class GestionGuiaController {
  constructor(
    private readonly listarGuias: ListarGuiasGestionUseCase,
    private readonly obtenerGuia: ObtenerGuiaGestionUseCase,
    private readonly crearGuia: CrearGuiaUseCase,
    private readonly editarGuia: EditarGuiaUseCase,
    private readonly publicarGuia: PublicarGuiaUseCase,
    private readonly ocultarGuia: OcultarGuiaUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Todas las guías, en cualquier estado (HU-13)',
    description:
      'Con quién creó cada una, quién la editó por última vez y cuándo.',
  })
  @ApiOkResponse({ type: GuiasGestionPaginadasDto })
  listar(
    @Query() criterio: ListarGuiasGestionDto,
  ): Promise<GuiasGestionPaginadasDto> {
    return this.listarGuias.ejecutar(criterio);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una guía (HU-13)',
    description:
      'Nace en BORRADOR: el público no la ve hasta publicarla. El slug se genera del título.',
  })
  @ApiCreatedResponse({ type: GuiaGestionDetalleDto })
  crear(
    @Body() datos: GuardarGuiaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<GuiaGestionDetalleDto> {
    return this.crearGuia.ejecutar(datos.aComando(), usuario.id);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Una guía con sus pasos, para editarla (HU-13)',
    description: 'También borradores y ocultas.',
  })
  @ApiOkResponse({ type: GuiaGestionDetalleDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  obtener(@Param() { slug }: SlugGuiaDto): Promise<GuiaGestionDetalleDto> {
    return this.obtenerGuia.ejecutar(slug);
  }

  @Put(':slug')
  @ApiOperation({
    summary: 'Editar una guía y sus pasos (HU-13, HU-15)',
    description:
      'Reemplaza los datos de la guía. Si se envía `pasos`, quedan exactamente esos y en ese orden: así se agregan, cambian, quitan y reordenan pasos. En una guía publicada el cambio se ve de inmediato.',
  })
  @ApiOkResponse({ type: GuiaGestionDetalleDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Una guía publicada no puede quedarse sin pasos',
  })
  editar(
    @Param() { slug }: SlugGuiaDto,
    @Body() datos: GuardarGuiaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<GuiaGestionDetalleDto> {
    return this.editarGuia.ejecutar(slug, datos.aComando(), usuario.id);
  }

  @Post(':slug/publicar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar una guía (HU-15)',
    description:
      'Aparece en el catálogo público. Sirve para un borrador y para volver a mostrar una oculta.',
  })
  @ApiOkResponse({ type: GuiaGestionDetalleDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'La guía no tiene pasos',
  })
  publicar(
    @Param() { slug }: SlugGuiaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<GuiaGestionDetalleDto> {
    return this.publicarGuia.ejecutar(slug, usuario.id);
  }

  @Post(':slug/ocultar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ocultar una guía publicada (HU-15)',
    description:
      'Sale del catálogo público. No se borra: el progreso de los usuarios en ella se conserva.',
  })
  @ApiOkResponse({ type: GuiaGestionDetalleDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'La guía es un borrador',
  })
  ocultar(
    @Param() { slug }: SlugGuiaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<GuiaGestionDetalleDto> {
    return this.ocultarGuia.ejecutar(slug, usuario.id);
  }
}
