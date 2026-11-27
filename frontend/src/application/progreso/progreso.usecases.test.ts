import { describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from '@/application/auth/ports';
import { SesionRequeridaError } from '@/domain/practica/errors';
import { ProgresoError } from '@/domain/progreso/errors';
import { ListarMiProgreso } from './ListarMiProgreso';
import type { ProgresoRepository } from './ports';
import { RegistrarLecturaPaso } from './RegistrarLecturaPaso';

const repo = () =>
  ({
    listar: vi
      .fn()
      .mockResolvedValue({ datos: [], total: 0, pagina: 1, limite: 20 }),
    registrarLectura: vi.fn().mockResolvedValue({}),
  }) as unknown as ProgresoRepository & {
    listar: ReturnType<typeof vi.fn>;
    registrarLectura: ReturnType<typeof vi.fn>;
  };

const auth = (rol: string | null) =>
  ({
    obtenerSesion: vi
      .fn()
      .mockResolvedValue(
        rol ? { accessToken: 'tok', usuario: { id: 'u', rol } } : null,
      ),
  }) as unknown as AuthRepository;

describe('casos de uso de progreso (C-10)', () => {
  it('Listar usa el token del usuario público y aplica página 1 / límite 20', async () => {
    const r = repo();
    await new ListarMiProgreso(r, auth('USUARIO_PUBLICO')).ejecutar({
      categoria: 'x',
    });
    expect(r.listar).toHaveBeenCalledWith('tok', {
      pagina: 1,
      limite: 20,
      categoria: 'x',
    });
  });

  it.each([null, 'PERSONAL', 'ADMINISTRADOR'])(
    'sin usuario público (%s) no llama al backend',
    async (rol) => {
      const r = repo();
      await expect(
        new ListarMiProgreso(r, auth(rol)).ejecutar(),
      ).rejects.toThrow(SesionRequeridaError);
      await expect(
        new RegistrarLecturaPaso(r, auth(rol)).ejecutar('smishing', 1),
      ).rejects.toThrow(SesionRequeridaError);
      expect(r.listar).not.toHaveBeenCalled();
      expect(r.registrarLectura).not.toHaveBeenCalled();
    },
  );

  it('RegistrarLectura envía slug y orden con el token', async () => {
    const r = repo();
    await new RegistrarLecturaPaso(r, auth('USUARIO_PUBLICO')).ejecutar(
      'smishing',
      2,
    );
    expect(r.registrarLectura).toHaveBeenCalledWith('tok', 'smishing', 2);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rechaza el orden %s sin llamar al servidor',
    async (orden) => {
      const r = repo();
      await expect(
        new RegistrarLecturaPaso(r, auth('USUARIO_PUBLICO')).ejecutar(
          'smishing',
          orden,
        ),
      ).rejects.toBeInstanceOf(ProgresoError);
      expect(r.registrarLectura).not.toHaveBeenCalled();
    },
  );
});
