import { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import type { PreferencesApplier, PreferencesRepository } from './ports';

export class ResetAccessibilityPreferences {
  constructor(
    private readonly repository: PreferencesRepository,
    private readonly applier: PreferencesApplier,
  ) {}

  async execute(): Promise<AccessibilityPreferences> {
    const next = AccessibilityPreferences.default();
    this.applier.apply(next);
    await this.repository.save(next);
    return next;
  }
}
