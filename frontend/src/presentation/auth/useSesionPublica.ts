import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import type { AuthSession } from '@/domain/auth/types';
import { container } from '@/main/container';

const EVENTO = 'kama:sesion-publica';

/** Avisa a la app que la sesión pública cambió sin navegar (cerrar sesión, eliminar cuenta). */
export function avisarCambioSesion(): void {
  window.dispatchEvent(new Event(EVENTO));
}

/**
 * La sesión del usuario público guardada en este navegador. Se vuelve a leer al cambiar de
 * página y cuando una pantalla avisa con avisarCambioSesion(). `undefined` mientras carga.
 */
export function useSesionPublica(): AuthSession | null | undefined {
  const { pathname } = useLocation();
  const [sesion, setSesion] = useState<AuthSession | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let vigente = true;
    const leer = () => {
      void container.auth.obtenerSesion.ejecutar().then((s) => {
        if (vigente) setSesion(s);
      });
    };
    leer();
    window.addEventListener(EVENTO, leer);
    return () => {
      vigente = false;
      window.removeEventListener(EVENTO, leer);
    };
  }, [pathname]);

  return sesion;
}
