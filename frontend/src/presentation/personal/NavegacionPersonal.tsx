import { NavLink, useNavigate } from 'react-router';
import type { SesionPersonal } from '@/domain/personal/types';
import { container } from '@/main/container';

const enlace = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center min-h-11 px-4 rounded-xl font-semibold no-underline border-2 ${
    isActive
      ? 'bg-btn-primary-bg text-btn-primary-fg border-btn-primary-border'
      : 'bg-btn-secondary-bg text-btn-secondary-fg border-btn-secondary-border hover:border-btn-secondary-hover-border'
  }`;

/** Menú del panel del personal (HU-13, HU-30, HU-04). Solo el administrador ve «Personal». */
export function NavegacionPersonal({ sesion }: { sesion: SesionPersonal }) {
  const navigate = useNavigate();
  const salir = async () => {
    await container.personal.cerrarSesion.ejecutar();
    navigate('/personal/acceso');
  };
  return (
    <nav
      aria-label="Panel del personal"
      className="flex flex-wrap items-center gap-3 print:hidden"
    >
      <NavLink to="/personal/cola" className={enlace}>
        Cola de ayuda
      </NavLink>
      <NavLink to="/personal/guias" className={enlace}>
        Guías
      </NavLink>
      {sesion.usuario.rol === 'ADMINISTRADOR' && (
        <NavLink to="/admin/personal" className={enlace}>
          Personal
        </NavLink>
      )}
      <NavLink to="/codigos-qr" className={enlace}>
        Códigos QR
      </NavLink>
      <span className="ml-auto text-muted">
        {sesion.usuario.nombre} ·{' '}
        {sesion.usuario.rol === 'ADMINISTRADOR' ? 'Administración' : 'Monitor'}
      </span>
      <button
        type="button"
        onClick={() => void salir()}
        className="inline-flex items-center min-h-11 px-4 rounded-xl font-semibold border-2 bg-btn-secondary-bg text-btn-secondary-fg border-btn-secondary-border hover:border-btn-secondary-hover-border cursor-pointer"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}
