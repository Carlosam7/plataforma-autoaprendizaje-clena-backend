import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { SesionPersonal } from '@/domain/personal/types';
import { container } from '@/main/container';

/**
 * Pantallas del personal: sin sesión lleva al ingreso del personal y, si aún tiene la
 * contraseña temporal, al cambio obligatorio. `null` mientras comprueba.
 */
export function useSesionPersonal(): SesionPersonal | null {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<SesionPersonal | null>(null);

  useEffect(() => {
    let vigente = true;
    void container.personal.obtenerSesion.ejecutar().then((s) => {
      if (!vigente) return;
      if (!s) navigate('/personal/acceso', { replace: true });
      else if (s.usuario.debeCambiarPassword)
        navigate('/personal/primer-acceso', { replace: true });
      else setSesion(s);
    });
    return () => {
      vigente = false;
    };
  }, [navigate]);

  return sesion;
}
