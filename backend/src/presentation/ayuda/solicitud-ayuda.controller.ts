import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import {
  ResolverSolicitudAyudaUseCase,
  TomarSolicitudAyudaUseCase,
} from '../../application/ayuda/atender-solicitud-ayuda.use-cases.js';
import { CancelarSolicitudAyudaUseCase } from '../../application/ayuda/cancelar-solicitud-ayuda.use-case.js';
import { ListarSolicitudesAyudaUseCase } from '../../application/ayuda/listar-solicitudes-ayuda.use-case.js';
import { ObtenerSolicitudAyudaUseCase } from '../../application/ayuda/obtener-solicitud-ayuda.use-case.js';
import { SolicitarAyudaUseCase } from '../../application/ayuda/solicitar-ayuda.use-case.js';
import { Publico, SesionOpcional } from '../shared/publico.decorator.js';
import {
  leerCookieLlaveAyuda,
  ponerCookieLlaveAyuda,
} from './cookie-llave-ayuda.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import {
  UsuarioActual,
  UsuarioOpcional,
} from '../shared/usuario-actual.decorator.js';
import { ListarSolicitudesDto } from './dto/listar-solicitudes.dto.js';
import {
  IdSolicitudDto,
  ResolverSolicitudDto,
  SolicitarAyudaDto,
} from './dto/solicitar-ayuda.dto.js';
import {
  AyudaSolicitadaDto,
  SolicitudAyudaDto,
  SolicitudEnColaDto,
  SolicitudesPaginadasDto,
} from './dto/solicitud-ayuda.dto.js';

@ApiTags('ayuda')
@ApiBadRequestResponse({ type: RespuestaErrorDto })
@Controller('solicitudes-ayuda')
export class SolicitudAyudaController {
  constructor(
    private readonly solicitarAyuda: SolicitarAyudaUseCase,
    private readonly obtenerSolicitud: ObtenerSolicitudAyudaUseCase,
    private readonly cancelarSolicitud: CancelarSolicitudAyudaUseCase,
    private readonly listarSolicitudes: ListarSolicitudesAyudaUseCase,
    private readonly tomarSolicitud: TomarSolicitudAyudaUseCase,
    private readonly resolverSolicitud: ResolverSolicitudAyudaUseCase,
  ) {}

  @Post()
  @SesionOpcional()
  @ApiOperation({
    summary: 'Llamar a un monitor (HU-29)',
    description:
      'No exige sesión: basta con el equipo. Responde con la cookie httpOnly `llave_ayuda` (path /api/v1/solicitudes-ayuda): solo el navegador que la tiene consulta o cancela la solicitud (C-05). ' +
      'Si el equipo ya tiene una solicitud activa no se crea otra: al mismo navegador le responde 200 con la existente y `yaExistia: true`; a otro navegador, 409 sin revelarla.',
  })
  @ApiCreatedResponse({
    type: AyudaSolicitadaDto,
    headers: {
      'Set-Cookie': {
        description:
          'llave_ayuda=<llave>; Path=/api/v1/solicitudes-ayuda; HttpOnly; SameSite=Strict; Max-Age=43200',
        schema: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({
    type: AyudaSolicitadaDto,
    description: 'Este navegador ya tenía una solicitud activa para el equipo',
  })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description:
      'EQUIPO_CON_SOLICITUD_ACTIVA: otro navegador ya pidió ayuda para ese equipo',
  })
  async solicitar(
    @Body() datos: SolicitarAyudaDto,
    @UsuarioOpcional() usuario: UsuarioAutenticado | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AyudaSolicitadaDto> {
    const { solicitud, llave } = await this.solicitarAyuda.ejecutar(
      datos,
      usuario,
      leerCookieLlaveAyuda(req),
    );
    ponerCookieLlaveAyuda(res, llave);
    if (solicitud.yaExistia) res.status(HttpStatus.OK);
    return solicitud;
  }

  @Get()
  @Roles('PERSONAL', 'ADMINISTRADOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cola de solicitudes de ayuda, para el personal (HU-30)',
    description:
      'De la más antigua a la más reciente, con la guía y el paso donde estaba la persona y quién la atiende. La cola es `estado=PENDIENTE`; el frontend la vuelve a pedir cada 15 segundos.',
  })
  @ApiOkResponse({ type: SolicitudesPaginadasDto })
  @ApiUnauthorizedResponse({
    type: RespuestaErrorDto,
    description: 'Sin sesión',
  })
  @ApiForbiddenResponse({
    type: RespuestaErrorDto,
    description: 'No es del personal',
  })
  listar(
    @Query() criterio: ListarSolicitudesDto,
  ): Promise<SolicitudesPaginadasDto> {
    return this.listarSolicitudes.ejecutar(criterio);
  }

  @Get(':id')
  @Publico()
  @ApiOperation({
    summary: 'Estado de mi solicitud y mi puesto en la cola (HU-29)',
    description:
      'El frontend la consulta cada cierto tiempo mientras espera. Exige la cookie `llave_ayuda` que entregó el POST (`credentials: include`).',
  })
  @ApiOkResponse({ type: SolicitudAyudaDto })
  @ApiNotFoundResponse({
    type: RespuestaErrorDto,
    description:
      'SOLICITUD_NO_ENCONTRADA: no existe o la pidió otro navegador (sin la llave no se distingue)',
  })
  obtener(
    @Param() { id }: IdSolicitudDto,
    @Req() req: Request,
  ): Promise<SolicitudAyudaDto> {
    return this.obtenerSolicitud.ejecutar(id, leerCookieLlaveAyuda(req));
  }

  @Post(':id/tomar')
  @HttpCode(HttpStatus.OK)
  @Roles('PERSONAL', 'ADMINISTRADOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tomar una solicitud pendiente (HU-30)',
    description:
      'Pasa a EN_ATENCION a nombre de quien la toma, para que otro monitor no la tome.',
  })
  @ApiOkResponse({ type: SolicitudEnColaDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Otro monitor ya la tomó, o ya se cerró',
  })
  tomar(
    @Param() { id }: IdSolicitudDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<SolicitudEnColaDto> {
    return this.tomarSolicitud.ejecutar(id, usuario.id);
  }

  @Post(':id/resolver')
  @HttpCode(HttpStatus.OK)
  @Roles('PERSONAL', 'ADMINISTRADOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar como resuelta la solicitud que estoy atendiendo (HU-30)',
    description: 'Solo quien la tomó. El comentario es opcional.',
  })
  @ApiOkResponse({ type: SolicitudEnColaDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiForbiddenResponse({
    type: RespuestaErrorDto,
    description: 'La está atendiendo otra persona',
  })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Nadie la ha tomado, o ya se cerró',
  })
  resolver(
    @Param() { id }: IdSolicitudDto,
    @Body() { comentario }: ResolverSolicitudDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<SolicitudEnColaDto> {
    return this.resolverSolicitud.ejecutar(id, usuario.id, comentario);
  }

  @Delete(':id')
  @Publico()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar mi solicitud (HU-29)',
    description:
      'Porque resolví la duda por mi cuenta. La solicitud no se borra: queda CANCELADA. Exige la cookie `llave_ayuda` que entregó el POST.',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    type: RespuestaErrorDto,
    description: 'SOLICITUD_NO_ENCONTRADA: no existe o la pidió otro navegador',
  })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Ya estaba resuelta o cancelada',
  })
  async cancelar(
    @Param() { id }: IdSolicitudDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.cancelarSolicitud.ejecutar(id, leerCookieLlaveAyuda(req));
  }
}
