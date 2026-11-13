import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityPreferences } from '@/domain/accessibility/AccessibilityPreferences';
import { FONT_LABEL } from './labels';
import {
  AccessibilityContext,
  type AccessibilityContextValue,
  type AccessibilityUseCases,
} from './context';

function fontMessage(p: AccessibilityPreferences): string {
  const limit = !p.canIncreaseFont
    ? '. Es el tamaño máximo'
    : !p.canDecreaseFont
      ? '. Es el tamaño normal'
      : '';
  return `Letra ${FONT_LABEL[p.fontSize].toLowerCase()}${limit}`;
}

export function AccessibilityProvider({
  useCases,
  children,
}: {
  useCases: AccessibilityUseCases;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(() =>
    AccessibilityPreferences.default(),
  );
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    let active = true;
    void useCases.load.execute().then((p) => {
      if (active) setPreferences(p);
    });
    return () => {
      active = false;
    };
  }, [useCases]);

  const value = useMemo<AccessibilityContextValue>(() => {
    const commit = (next: AccessibilityPreferences, message: string) => {
      setPreferences(next);
      setAnnouncement(message);
    };
    return {
      preferences,
      announcement,
      increaseFont: () =>
        void useCases.changeFontSize
          .execute(preferences, 'increase')
          .then((n) => commit(n, fontMessage(n))),
      decreaseFont: () =>
        void useCases.changeFontSize
          .execute(preferences, 'decrease')
          .then((n) => commit(n, fontMessage(n))),
      toggleContrast: () =>
        void useCases.toggleContrast
          .execute(preferences)
          .then((n) =>
            commit(
              n,
              `Alto contraste ${n.highContrast ? 'activado' : 'desactivado'}`,
            ),
          ),
      reset: () =>
        void useCases.reset
          .execute()
          .then((n) => commit(n, 'Letra y contraste restablecidos')),
    };
  }, [preferences, announcement, useCases]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
