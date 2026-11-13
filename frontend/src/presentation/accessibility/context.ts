import { createContext, useContext } from 'react';
import type { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import type { ChangeFontSize } from '@/application/accessibility/ChangeFontSize';
import type { LoadAccessibilityPreferences } from '@/application/accessibility/LoadAccessibilityPreferences';
import type { ResetAccessibilityPreferences } from '@/application/accessibility/ResetAccessibilityPreferences';
import type { ToggleHighContrast } from '@/application/accessibility/ToggleHighContrast';

export interface AccessibilityUseCases {
  load: LoadAccessibilityPreferences;
  changeFontSize: ChangeFontSize;
  toggleContrast: ToggleHighContrast;
  reset: ResetAccessibilityPreferences;
}

export interface AccessibilityContextValue {
  preferences: AccessibilityPreferences;
  /** Texto para el lector de pantalla tras cada cambio. */
  announcement: string;
  increaseFont: () => void;
  decreaseFont: () => void;
  toggleContrast: () => void;
  reset: () => void;
}

export const AccessibilityContext =
  createContext<AccessibilityContextValue | null>(null);

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx)
    throw new Error(
      'useAccessibility debe usarse dentro de AccessibilityProvider',
    );
  return ctx;
}
