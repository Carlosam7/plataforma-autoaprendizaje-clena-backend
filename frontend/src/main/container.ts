import { ChangeFontSize } from '@/application/accessibility/ChangeFontSize';
import { LoadAccessibilityPreferences } from '@/application/accessibility/LoadAccessibilityPreferences';
import { ResetAccessibilityPreferences } from '@/application/accessibility/ResetAccessibilityPreferences';
import { ToggleHighContrast } from '@/application/accessibility/ToggleHighContrast';
import { ObtenerAvisoPrivacidad } from '@/application/auth/ObtenerAvisoPrivacidad';
import { ReenviarCodigoRegistro } from '@/application/auth/ReenviarCodigoRegistro';
import { SolicitarInicioSesion } from '@/application/auth/SolicitarInicioSesion';
import { SolicitarRegistro } from '@/application/auth/SolicitarRegistro';
import { VerificarCodigoRegistro } from '@/application/auth/VerificarCodigoRegistro';
import { VerificarInicioSesion } from '@/application/auth/VerificarInicioSesion';
import { CancelarSolicitudAyuda } from '@/application/ayuda/CancelarSolicitudAyuda';
import { ConsultarSolicitudAyuda } from '@/application/ayuda/ConsultarSolicitudAyuda';
import { SeguimientoSolicitudAyuda } from '@/application/ayuda/SeguimientoSolicitudAyuda';
import { SolicitarAyuda } from '@/application/ayuda/SolicitarAyuda';
import { CalcularResultadoPractica } from '@/application/guias/CalcularResultadoPractica';
import { ListarCategorias } from '@/application/guias/ListarCategorias';
import { ListarGuias } from '@/application/guias/ListarGuias';
import { ObtenerDetalleGuia } from '@/application/guias/ObtenerDetalleGuia';
import { CambiarPasswordInicial } from '@/application/personal/CambiarPasswordInicial';
import { CerrarSesionPersonal } from '@/application/personal/CerrarSesionPersonal';
import { CrearPersonal } from '@/application/personal/CrearPersonal';
import { DesactivarPersonal } from '@/application/personal/DesactivarPersonal';
import { EditarPersonal } from '@/application/personal/EditarPersonal';
import { ListarPersonal } from '@/application/personal/ListarPersonal';
import { ObtenerSesionPersonal } from '@/application/personal/ObtenerSesionPersonal';
import { ReactivarPersonal } from '@/application/personal/ReactivarPersonal';
import { SolicitarCodigoPasswordInicial } from '@/application/personal/SolicitarCodigoPasswordInicial';
import { SolicitarInicioSesionPersonal } from '@/application/personal/SolicitarInicioSesionPersonal';
import { VerificarInicioSesionPersonal } from '@/application/personal/VerificarInicioSesionPersonal';
import { EvaluarRespuestaInvitado } from '@/application/practica/EvaluarRespuestaInvitado';
import { IniciarIntentoAutenticado } from '@/application/practica/IniciarIntentoAutenticado';
import { ObtenerActividad } from '@/application/practica/ObtenerActividad';
import { ResponderPreguntaAutenticado } from '@/application/practica/ResponderPreguntaAutenticado';
import { determinarModoPractica } from '@/application/practica/sesionPractica';
import { DomPreferencesApplier } from '@/infrastructure/accessibility/DomPreferencesApplier';
import { LocalStoragePreferencesRepository } from '@/infrastructure/accessibility/LocalStoragePreferencesRepository';
import { HttpAuthRepository } from '@/infrastructure/auth/HttpAuthRepository';
import { HttpAyudaRepository } from '@/infrastructure/ayuda/HttpAyudaRepository';
import { HttpGuiasRepository } from '@/infrastructure/guias/HttpGuiasRepository';
import { HttpPersonalRepository } from '@/infrastructure/personal/HttpPersonalRepository';
import { HttpPracticaRepository } from '@/infrastructure/practica/HttpPracticaRepository';

// Único lugar donde se eligen implementaciones.
const preferencesRepository = new LocalStoragePreferencesRepository();
const preferencesApplier = new DomPreferencesApplier();
const authRepository = new HttpAuthRepository();
const guiasRepository = new HttpGuiasRepository();
const personalRepository = new HttpPersonalRepository();
// C-05: titularidad por cookie httpOnly llave_ayuda (BE-02).
const ayudaRepository = new HttpAyudaRepository();
// C-04 (invitados sin persistencia) entregado por BE-01.
const practicaRepository = new HttpPracticaRepository({
  evaluacionInvitadoHabilitada: true,
});

export const container = {
  accessibility: {
    load: new LoadAccessibilityPreferences(
      preferencesRepository,
      preferencesApplier,
    ),
    changeFontSize: new ChangeFontSize(
      preferencesRepository,
      preferencesApplier,
    ),
    toggleContrast: new ToggleHighContrast(
      preferencesRepository,
      preferencesApplier,
    ),
    reset: new ResetAccessibilityPreferences(
      preferencesRepository,
      preferencesApplier,
    ),
  },
  auth: {
    obtenerAvisoPrivacidad: new ObtenerAvisoPrivacidad(authRepository),
    solicitarRegistro: new SolicitarRegistro(authRepository),
    solicitarInicioSesion: new SolicitarInicioSesion(authRepository),
    verificarCodigo: new VerificarCodigoRegistro(authRepository),
    verificarInicioSesion: new VerificarInicioSesion(authRepository),
    reenviarCodigo: new ReenviarCodigoRegistro(authRepository),
    authRepository,
  },
  guias: {
    listarCategorias: new ListarCategorias(guiasRepository),
    listar: new ListarGuias(guiasRepository),
    obtenerDetalle: new ObtenerDetalleGuia(guiasRepository),
    calcularResultado: new CalcularResultadoPractica(),
    guiasRepository,
  },
  practica: {
    obtenerActividad: new ObtenerActividad(practicaRepository),
    iniciarIntentoAutenticado: new IniciarIntentoAutenticado(
      practicaRepository,
      authRepository,
    ),
    responderAutenticado: new ResponderPreguntaAutenticado(
      practicaRepository,
      authRepository,
    ),
    evaluarInvitado: new EvaluarRespuestaInvitado(practicaRepository),
    determinarModo: () => determinarModoPractica(authRepository),
    practicaRepository,
  },
  ayuda: {
    solicitar: new SolicitarAyuda(ayudaRepository),
    consultar: new ConsultarSolicitudAyuda(ayudaRepository),
    cancelar: new CancelarSolicitudAyuda(ayudaRepository),
    seguimiento: new SeguimientoSolicitudAyuda(ayudaRepository),
  },
  personal: {
    solicitarInicioSesion: new SolicitarInicioSesionPersonal(
      personalRepository,
    ),
    verificarInicioSesion: new VerificarInicioSesionPersonal(
      personalRepository,
    ),
    solicitarCodigoPassword: new SolicitarCodigoPasswordInicial(
      personalRepository,
    ),
    cambiarPasswordInicial: new CambiarPasswordInicial(personalRepository),
    listar: new ListarPersonal(personalRepository),
    crear: new CrearPersonal(personalRepository),
    editar: new EditarPersonal(personalRepository),
    desactivar: new DesactivarPersonal(personalRepository),
    reactivar: new ReactivarPersonal(personalRepository),
    obtenerSesion: new ObtenerSesionPersonal(personalRepository),
    cerrarSesion: new CerrarSesionPersonal(personalRepository),
    personalRepository,
  },
};
