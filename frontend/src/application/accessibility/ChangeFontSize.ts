import type { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import type { PreferencesApplier, PreferencesRepository } from './ports';

export type FontSizeDirection = 'increase' | 'decrease';

export class ChangeFontSize {
  constructor(
    private readonly repository: PreferencesRepository,
    private readonly applier: PreferencesApplier,
  ) {}

  async execute(
    current: AccessibilityPreferences,
    direction: FontSizeDirection,
  ): Promise<AccessibilityPreferences> {
    const next =
      direction === 'increase'
        ? current.increaseFont()
        : current.decreaseFont();
    this.applier.apply(next);
    await this.repository.save(next);
    return next;
  }
}
