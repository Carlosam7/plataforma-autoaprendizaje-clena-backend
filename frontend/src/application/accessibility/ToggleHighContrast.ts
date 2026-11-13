import type { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import type { PreferencesApplier, PreferencesRepository } from './ports';

export class ToggleHighContrast {
  constructor(
    private readonly repository: PreferencesRepository,
    private readonly applier: PreferencesApplier,
  ) {}

  async execute(
    current: AccessibilityPreferences,
  ): Promise<AccessibilityPreferences> {
    const next = current.toggleHighContrast();
    this.applier.apply(next);
    await this.repository.save(next);
    return next;
  }
}
