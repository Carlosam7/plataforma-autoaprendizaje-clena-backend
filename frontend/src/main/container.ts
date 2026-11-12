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
import { DomPreferencesApplier } from '@/infrastructure/accessibility/DomPreferencesApplier';
import { LocalStoragePreferencesRepository } from '@/infrastructure/accessibility/LocalStoragePreferencesRepository';
import { HttpAuthRepository } from '@/infrastructure/auth/HttpAuthRepository';
import { InMemoryGuiasRepository } from '@/infrastructure/guias/InMemoryGuiasRepository';

// Único lugar donde se eligen implementaciones.
const preferencesRepository = new LocalStoragePreferencesRepository();
const preferencesApplier = new DomPreferencesApplier();
const authRepository = new HttpAuthRepository();
const guiasRepository = new InMemoryGuiasRepository();

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
};
