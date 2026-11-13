import { ChangeFontSize } from '@/application/accessibility/ChangeFontSize';
import { LoadAccessibilityPreferences } from '@/application/accessibility/LoadAccessibilityPreferences';
import { ResetAccessibilityPreferences } from '@/application/accessibility/ResetAccessibilityPreferences';
import { ToggleHighContrast } from '@/application/accessibility/ToggleHighContrast';
import { ObtenerAvisoPrivacidad } from '@/application/auth/ObtenerAvisoPrivacidad';
import { ReenviarCodigoRegistro } from '@/application/auth/ReenviarCodigoRegistro';
import { SolicitarInicioSesion } from '@/application/auth/SolicitarInicioSesion';
import { SolicitarRegistro } from '@/application/auth/SolicitarRegistro';
import { VerificarCodigoRegistro } from '@/application/auth/VerificarCodigoRegistro';
import { CalcularResultadoPractica } from '@/application/guias/CalcularResultadoPractica';
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
import { DomPreferencesApplier } from '@/infrastructure/accessibility/DomPreferencesApplier';
import { LocalStoragePreferencesRepository } from '@/infrastructure/accessibility/LocalStoragePreferencesRepository';
import { HttpAuthRepository } from '@/infrastructure/auth/HttpAuthRepository';
import { HttpGuiasRepository } from '@/infrastructure/guias/HttpGuiasRepository';
import { HttpPersonalRepository } from '@/infrastructure/personal/HttpPersonalRepository';

// Único lugar donde se eligen implementaciones.
const preferencesRepository = new LocalStoragePreferencesRepository();
const preferencesApplier = new DomPreferencesApplier();
const authRepository = new HttpAuthRepository();
const guiasRepository = new HttpGuiasRepository();
const personalRepository = new HttpPersonalRepository();

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
    reenviarCodigo: new ReenviarCodigoRegistro(authRepository),
    authRepository,
  },
  guias: {
    listar: new ListarGuias(guiasRepository),
    obtenerDetalle: new ObtenerDetalleGuia(guiasRepository),
    calcularResultado: new CalcularResultadoPractica(),
    guiasRepository,
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
