import { describe, expect, it } from 'vitest';
import { AccessibilityPreferences } from './AccessibilityPreferences';

describe('AccessibilityPreferences', () => {
  it('arranca con letra normal y contraste normal', () => {
    const p = AccessibilityPreferences.default();
    expect(p.toPrimitives()).toEqual({
      fontSize: 'normal',
      highContrast: false,
    });
  });

  it('aumenta y disminuye la letra sin salirse de los límites', () => {
    const max = AccessibilityPreferences.default()
      .increaseFont()
      .increaseFont()
      .increaseFont();
    expect(max.fontSize).toBe('muy_grande');
    expect(max.canIncreaseFont).toBe(false);
    const min = max.decreaseFont().decreaseFont().decreaseFont();
    expect(min.fontSize).toBe('normal');
    expect(min.canDecreaseFont).toBe(false);
  });

  it('alterna el alto contraste sin tocar el tamaño', () => {
    const p = AccessibilityPreferences.default()
      .increaseFont()
      .toggleHighContrast();
    expect(p.toPrimitives()).toEqual({
      fontSize: 'grande',
      highContrast: true,
    });
    expect(p.toggleHighContrast().highContrast).toBe(false);
  });

  it('restaura valores válidos e ignora los inválidos', () => {
    expect(
      AccessibilityPreferences.restore({
        fontSize: 'grande',
        highContrast: true,
      }).toPrimitives(),
    ).toEqual({
      fontSize: 'grande',
      highContrast: true,
    });
    expect(
      AccessibilityPreferences.restore({
        fontSize: 'enorme',
        highContrast: 'sí',
      }).toPrimitives(),
    ).toEqual({
      fontSize: 'normal',
      highContrast: false,
    });
    expect(AccessibilityPreferences.restore(null).fontSize).toBe('normal');
  });
});
