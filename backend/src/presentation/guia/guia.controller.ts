import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import { ListarGuiasUseCase } from '../../application/guia/listar-guias.use-case.js';
import { ObtenerGuiaUseCase } from '../../application/guia/obtener-guia.use-case.js';
import { RegistrarConsultaGuiaUseCase } from '../../application/guia/registrar-consulta-guia.use-case.js';
import { Publico, SesionOpcional } from '../shared/publico.decorator.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { UsuarioOpcional } from '../shared/usuario-actual.decorator.js';
import { DetalleGuiaDto, GuiasPaginadasDto } from './dto/guia.dto.js';
import { ListarGuiasDto } from './dto/listar-guias.dto.js';
import { SlugGuiaDto } from './dto/slug-guia.dto.js';

@ApiTags('guias')
// HU-03: el catálogo se puede ver sin cuenta.
@Publico()
@ApiBadRequestResponse({ type: RespuestaErrorDto })
@Controller('guias')
export class GuiaController {
  constructor(
    private readonly listarGuias: ListarGuiasUseCase,
    private readonly obtenerGuia: ObtenerGuiaUseCase,
    private readonly registrarConsulta: RegistrarConsultaGuiaUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Guías publicadas de una categoría (HU-09)',
    description:
      'Solo guías publicadas; los borradores y las ocultas no salen.',
  })
  @ApiOkResponse({ type: GuiasPaginadasDto })
  listar(@Query() criterio: ListarGuiasDto): Promise<GuiasPaginadasDto> {
    return this.listarGuias.ejecutar(criterio);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Una guía con sus pasos en orden (HU-10)',
    description:
      'Solo lee: para las estadísticas, el frontend registra la apertura con POST /guias/{slug}/consultas.',
  })
  @ApiOkResponse({ type: DetalleGuiaDto })
  @ApiNotFoundResponse({
    type: RespuestaErrorDto,
    description: 'No existe o no está publicada',
  })
  obtener(@Param() { slug }: SlugGuiaDto): Promise<DetalleGuiaDto> {
    return this.obtenerGuia.ejecutar(slug);
  }

  @Post(':slug/consultas')
  @SesionOpcional()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Registrar que se abrió una guía (HU-10, HU-31)',
    description:
      'Sin sesión queda anónima. Con el token de un usuario público se asocia a su cuenta; un token inválido no da error: se registra como anónima.',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  async registrar(
    @Param() { slug }: SlugGuiaDto,
    @UsuarioOpcional() usuario: UsuarioAutenticado | null,
  ): Promise<void> {
    await this.registrarConsulta.ejecutar(slug, usuario);
  }
}
