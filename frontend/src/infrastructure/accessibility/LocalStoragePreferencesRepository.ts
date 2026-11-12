import { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import type { PreferencesRepository } from '@/application/accessibility/ports';

// Misma clave que el script de index.html.
export const PREFERENCES_KEY = 'clena.accesibilidad.v1';

export class LocalStoragePreferencesRepository implements PreferencesRepository {
  async load(): Promise<AccessibilityPreferences | null> {
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      return raw ? AccessibilityPreferences.restore(JSON.parse(raw)) : null;
    } catch {
      return null; // almacenamiento bloqueado o JSON dañado
    }
  }

  async save(preferences: AccessibilityPreferences): Promise<void> {
    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify(preferences.toPrimitives()),
      );
    } catch {
      // modo privado: la preferencia vale solo para esta visita
    }
  }
}
