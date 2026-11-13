import { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import type { PreferencesApplier, PreferencesRepository } from './ports';

export class LoadAccessibilityPreferences {
  constructor(
    private readonly repository: PreferencesRepository,
    private readonly applier: PreferencesApplier,
  ) {}

  async execute(): Promise<AccessibilityPreferences> {
    const preferences =
      (await this.repository.load()) ?? AccessibilityPreferences.default();
    this.applier.apply(preferences);
    return preferences;
  }
}
