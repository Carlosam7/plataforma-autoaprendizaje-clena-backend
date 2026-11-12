import { ChangeFontSize } from '@/application/accessibility/ChangeFontSize';
import { LoadAccessibilityPreferences } from '@/application/accessibility/LoadAccessibilityPreferences';
import { ResetAccessibilityPreferences } from '@/application/accessibility/ResetAccessibilityPreferences';
import { ToggleHighContrast } from '@/application/accessibility/ToggleHighContrast';
import { DomPreferencesApplier } from '@/infrastructure/accessibility/DomPreferencesApplier';
import { LocalStoragePreferencesRepository } from '@/infrastructure/accessibility/LocalStoragePreferencesRepository';

// Único lugar donde se eligen implementaciones. Para guardar el perfil en la API
// (HU-36/37) basta con cambiar aquí el repositorio por uno HTTP.
const preferencesRepository = new LocalStoragePreferencesRepository();
const preferencesApplier = new DomPreferencesApplier();

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
};
