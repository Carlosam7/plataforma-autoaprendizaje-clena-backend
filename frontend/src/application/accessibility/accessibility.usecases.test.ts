import { describe, expect, it } from 'vitest';
import { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import { ChangeFontSize } from './ChangeFontSize';
import { LoadAccessibilityPreferences } from './LoadAccessibilityPreferences';
import { ResetAccessibilityPreferences } from './ResetAccessibilityPreferences';
import { ToggleHighContrast } from './ToggleHighContrast';
import type { PreferencesApplier, PreferencesRepository } from './ports';

function fakes(initial: AccessibilityPreferences | null = null) {
  let stored = initial;
  const applied: AccessibilityPreferences[] = [];
  const repository: PreferencesRepository = {
    load: async () => stored,
    save: async (p) => {
      stored = p;
    },
  };
  const applier: PreferencesApplier = { apply: (p) => void applied.push(p) };
  return { repository, applier, applied, stored: () => stored };
}

describe('casos de uso de accesibilidad', () => {
  it('carga las guardadas y las aplica; sin nada guardado usa las de fábrica', async () => {
    const saved = AccessibilityPreferences.default().toggleHighContrast();
    const a = fakes(saved);
    expect(
      await new LoadAccessibilityPreferences(a.repository, a.applier).execute(),
    ).toBe(saved);
    expect(a.applied).toEqual([saved]);

    const b = fakes();
    expect(
      (
        await new LoadAccessibilityPreferences(
          b.repository,
          b.applier,
        ).execute()
      ).fontSize,
    ).toBe('normal');
  });

  it('cambia el tamaño de letra, lo aplica y lo guarda', async () => {
    const f = fakes();
    const next = await new ChangeFontSize(f.repository, f.applier).execute(
      AccessibilityPreferences.default(),
      'increase',
    );
    expect(next.fontSize).toBe('grande');
    expect(f.stored()).toBe(next);
    expect(f.applied.at(-1)).toBe(next);
    const back = await new ChangeFontSize(f.repository, f.applier).execute(
      next,
      'decrease',
    );
    expect(back.fontSize).toBe('normal');
  });

  it('alterna el contraste y restablece todo', async () => {
    const f = fakes();
    const on = await new ToggleHighContrast(f.repository, f.applier).execute(
      AccessibilityPreferences.default(),
    );
    expect(on.highContrast).toBe(true);
    const reset = await new ResetAccessibilityPreferences(
      f.repository,
      f.applier,
    ).execute();
    expect(reset.toPrimitives()).toEqual({
      fontSize: 'normal',
      highContrast: false,
    });
    expect(f.stored()).toBe(reset);
  });
});
