import type { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import type { PreferencesApplier } from '@/application/accessibility/ports';

/** Los temas viven en CSS: aquí solo se escriben data-attributes en <html>. */
export class DomPreferencesApplier implements PreferencesApplier {
  apply(preferences: AccessibilityPreferences): void {
    const root = document.documentElement;
    root.dataset.fontSize = preferences.fontSize;
    root.dataset.contrast = preferences.highContrast ? 'high' : 'normal';
  }
}
