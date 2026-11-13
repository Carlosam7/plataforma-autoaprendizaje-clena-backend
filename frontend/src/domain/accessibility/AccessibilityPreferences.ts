export const FONT_SIZES = ['normal', 'grande', 'muy_grande'] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export interface AccessibilityPrimitives {
  fontSize: FontSize;
  highContrast: boolean;
}

/** Preferencias de lectura del visitante. Inmutable: cada cambio devuelve una instancia nueva. */
export class AccessibilityPreferences {
  private constructor(
    readonly fontSize: FontSize,
    readonly highContrast: boolean,
  ) {}

  static default(): AccessibilityPreferences {
    return new AccessibilityPreferences('normal', false);
  }

  /** Reconstruye desde datos externos; lo inválido vuelve al valor por defecto. */
  static restore(raw: unknown): AccessibilityPreferences {
    const base = AccessibilityPreferences.default();
    if (typeof raw !== 'object' || raw === null) return base;
    const { fontSize, highContrast } = raw as Record<string, unknown>;
    return new AccessibilityPreferences(
      FONT_SIZES.find((s) => s === fontSize) ?? base.fontSize,
      typeof highContrast === 'boolean' ? highContrast : base.highContrast,
    );
  }

  private get index(): number {
    return FONT_SIZES.indexOf(this.fontSize);
  }

  get canIncreaseFont(): boolean {
    return this.index < FONT_SIZES.length - 1;
  }

  get canDecreaseFont(): boolean {
    return this.index > 0;
  }

  increaseFont(): AccessibilityPreferences {
    if (!this.canIncreaseFont) return this;
    return new AccessibilityPreferences(
      FONT_SIZES[this.index + 1],
      this.highContrast,
    );
  }

  decreaseFont(): AccessibilityPreferences {
    if (!this.canDecreaseFont) return this;
    return new AccessibilityPreferences(
      FONT_SIZES[this.index - 1],
      this.highContrast,
    );
  }

  toggleHighContrast(): AccessibilityPreferences {
    return new AccessibilityPreferences(this.fontSize, !this.highContrast);
  }

  toPrimitives(): AccessibilityPrimitives {
    return { fontSize: this.fontSize, highContrast: this.highContrast };
  }
}
