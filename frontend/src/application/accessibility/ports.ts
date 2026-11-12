import type { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';

/** Dónde se guardan las preferencias (navegador hoy; perfil en la API cuando haya sesión). */
export interface PreferencesRepository {
  load(): Promise<AccessibilityPreferences | null>;
  save(preferences: AccessibilityPreferences): Promise<void>;
}

/** Cómo se hacen visibles las preferencias (hoy: atributos en <html>). */
export interface PreferencesApplier {
  apply(preferences: AccessibilityPreferences): void;
}
