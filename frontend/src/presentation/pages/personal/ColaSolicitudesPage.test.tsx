// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SolicitudAyudaError } from '@/domain/ayuda/errors';
import type {
  ListarSolicitudesCriterio,
  SolicitudEnCola,
  SolicitudesPaginadas,
} from '@/domain/ayuda/types';
import type { SesionPersonal } from '@/domain/personal/types';
import { container } from '@/main/container';
import { ColaSolicitudesPage } from './ColaSolicitudesPage';

const solicitud = (sobre: Partial<SolicitudEnCola> = {}): SolicitudEnCola => ({
  id: 'id-1',
  equipo: '12',
  tema: 'SEGURIDAD_DIGITAL',
  estado: 'PENDIENTE',
  guia: { slug: 'smishing', titulo: 'Smishing' },
  paso: 2,
  creadaEn: new Date('2026-11-27T15:00:00.000Z'),
  atendidaPor: null,
  tomadaEn: null,
  resueltaEn: null,
  comentarioResolucion: null,
  ...sobre,
});

const pagina = (
  datos: SolicitudEnCola[],
  total = datos.length,
): SolicitudesPaginadas => ({ datos, total, pagina: 1, limite: 20 });

const sesion = (
  rol: 'PERSONAL' | 'ADMINISTRADOR' = 'PERSONAL',
  debeCambiarPassword = false,
): SesionPersonal => ({
  usuario: { id: 'u1', nombre: 'Ana', rol, debeCambiarPassword },
  accessToken: 'tok',
});

const enAtencion = solicitud({
  id: 'id-2',
  equipo: '7',
  estado: 'EN_ATENCION',
  atendidaPor: 'Luis Díaz',
  tomadaEn: new Date('2026-11-27T15:05:00.000Z'),
});

function montar(s: SesionPersonal | null = sesion()) {
  vi.spyOn(container.personal.obtenerSesion, 'ejecutar').mockResolvedValue(s);
  return render(
    <MemoryRouter>
      <ColaSolicitudesPage />
    </MemoryRouter>,
  );
}

/** Cola simulada: lo que devuelve cada estado. */
function colaFalsa(
  pendientes: SolicitudEnCola[],
  atendidas: SolicitudEnCola[],
) {
  return vi
    .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
    .mockImplementation(async (_t, c: ListarSolicitudesCriterio = {}) =>
      c.estado === 'EN_ATENCION' ? pagina(atendidas) : pagina(pendientes),
    );
}

const llamadasDe = (
  spy: ReturnType<typeof colaFalsa>,
  estado: string,
  principal = true,
) =>
  spy.mock.calls.filter(
    ([, c]) => c?.estado === estado && (c?.limite === 1) !== principal,
  );

describe('ColaSolicitudesPage', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('protección y acceso', () => {
    it('sin sesión no consulta la API y ofrece ir al acceso del personal', async () => {
      const listar = colaFalsa([], []);
      montar(null);
      expect(await screen.findByText('Necesitas ingresar')).toBeTruthy();
      expect(
        screen
          .getByRole('link', { name: /acceso del personal/i })
          .getAttribute('href'),
      ).toBe('/personal/acceso');
      expect(listar).not.toHaveBeenCalled();
    });

    it('con contraseña inicial pendiente no consulta y envía a cambiarla', async () => {
      const listar = colaFalsa([], []);
      montar(sesion('PERSONAL', true));
      expect(await screen.findByText(/cambia tu contraseña/i)).toBeTruthy();
      expect(listar).not.toHaveBeenCalled();
    });

    it.each(['PERSONAL', 'ADMINISTRADOR'] as const)(
      '%s ve la cola',
      async (rol) => {
        colaFalsa([solicitud()], []);
        montar(sesion(rol));
        expect(await screen.findByText('Tomar solicitud')).toBeTruthy();
      },
    );
  });

  describe('listado', () => {
    it('muestra equipo, tema, guía, paso, estado, espera y contadores', async () => {
      colaFalsa([solicitud()], [enAtencion]);
      montar();
      expect(await screen.findByText('Smishing')).toBeTruthy();
      expect(screen.getByText('Paso 2')).toBeTruthy();
      expect(
        within(screen.getByRole('list')).getByText('Seguridad digital'),
      ).toBeTruthy();
      expect(within(screen.getByRole('list')).getByText('12')).toBeTruthy();
      expect(screen.getByText(/espera/)).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Pendientes (1)' }),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'En atención (1)' }),
      ).toBeTruthy();
    });

    it('sin guía ni paso muestra los textos alternativos', async () => {
      colaFalsa([solicitud({ guia: null, paso: null })], []);
      montar();
      expect(await screen.findByText('Sin guía asociada')).toBeTruthy();
      expect(screen.getByText('No especificado')).toBeTruthy();
    });

    it('colección vacía muestra «No hay solicitudes pendientes», no un error', async () => {
      colaFalsa([], []);
      montar();
      expect(
        await screen.findByText('No hay solicitudes pendientes'),
      ).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('En atención muestra monitor responsable y fecha de toma, y conserva la solicitud', async () => {
      colaFalsa([], [enAtencion]);
      montar();
      await screen.findByText('No hay solicitudes pendientes');
      await userEvent.click(
        screen.getByRole('button', { name: /^En atención/ }),
      );
      expect(await screen.findByText('Luis Díaz')).toBeTruthy();
      expect(screen.getByText('Tomada')).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Marcar como resuelta' }),
      ).toBeTruthy();
    });

    it('error inicial muestra alerta con Reintentar, nunca «vacío», y se recupera', async () => {
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockRejectedValueOnce(
          new SolicitudAyudaError('No pudimos conectarnos.', 'CONEXION'),
        )
        .mockRejectedValueOnce(
          new SolicitudAyudaError('No pudimos conectarnos.', 'CONEXION'),
        )
        .mockResolvedValue(pagina([solicitud()]));
      montar();
      expect((await screen.findByRole('alert')).textContent).toContain(
        'No pudimos conectarnos.',
      );
      expect(screen.queryByText('No hay solicitudes pendientes')).toBeNull();

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
      expect(await screen.findByText('Tomar solicitud')).toBeTruthy();
      expect(listar).toHaveBeenCalled();
    });

    it('401 muestra que la sesión terminó y no sigue consultando', async () => {
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockRejectedValue(
          new SolicitudAyudaError('x', 'SESION', undefined, 401),
        );
      montar();
      expect(await screen.findByText('Tu sesión terminó')).toBeTruthy();
      expect(listar.mock.calls.length).toBeLessThanOrEqual(2);
    });
  });

  describe('filtros y paginación (siempre contra la API)', () => {
    it('cambiar el tema consulta la API con ese tema y vuelve a la página 1', async () => {
      const listar = colaFalsa([solicitud()], []);
      montar();
      await screen.findByText('Tomar solicitud');
      await userEvent.selectOptions(screen.getByLabelText('Tema'), 'CORREO');
      await screen.findByText('Tomar solicitud');
      const ultima = listar.mock.calls
        .filter(([, c]) => c?.limite === 20)
        .at(-1);
      expect(ultima?.[1]).toMatchObject({
        estado: 'PENDIENTE',
        tema: 'CORREO',
        pagina: 1,
      });
    });

    it('siguiente/anterior piden la página al servidor y muestran el total', async () => {
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockImplementation(async (_t, c = {}) => ({
          datos: [solicitud({ id: `p${c.pagina}`, equipo: `E${c.pagina}` })],
          total: 45,
          pagina: c.pagina ?? 1,
          limite: 20,
        }));
      montar();
      expect(
        await screen.findByText(/Página 1 de 3 · 45 resultados/),
      ).toBeTruthy();
      expect(
        (screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      expect(await screen.findByText('E2')).toBeTruthy();
      expect(
        listar.mock.calls.some(([, c]) => c?.pagina === 2 && c?.limite === 20),
      ).toBe(true);

      await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
      expect(await screen.findByText('E1')).toBeTruthy();
    });

    it('cambiar de pestaña con página > 1 reinicia a la página 1', async () => {
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockImplementation(async (_t, c = {}) => ({
          datos: [solicitud({ id: `x${c.estado}${c.pagina}` })],
          total: 45,
          pagina: c.pagina ?? 1,
          limite: 20,
        }));
      montar();
      await screen.findByText(/Página 1 de 3/);
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      await screen.findByText(/Página 2 de 3/);
      await userEvent.click(
        screen.getByRole('button', { name: /^En atención/ }),
      );
      await screen.findByText(/Página 1 de 3/);
      const ultima = listar.mock.calls
        .filter(([, c]) => c?.limite === 20)
        .at(-1);
      expect(ultima?.[1]).toMatchObject({ estado: 'EN_ATENCION', pagina: 1 });
    });

    it('una respuesta vieja no pisa a la nueva al cambiar de filtro', async () => {
      let soltarVieja!: (p: SolicitudesPaginadas) => void;
      vi.spyOn(
        container.ayuda.listarSolicitudes,
        'ejecutar',
      ).mockImplementation((_t, c = {}) => {
        if (c.estado === 'PENDIENTE' && c.limite === 20 && !c.tema)
          return new Promise((r) => (soltarVieja = r));
        if (c.estado === 'PENDIENTE' && c.limite === 20)
          return Promise.resolve(pagina([solicitud({ equipo: 'NUEVA' })]));
        return Promise.resolve(pagina([]));
      });
      montar();
      await screen.findByText('Cargando solicitudes…');
      await userEvent.selectOptions(screen.getByLabelText('Tema'), 'CORREO');
      expect(await screen.findByText('NUEVA')).toBeTruthy();

      await act(async () => {
        soltarVieja(pagina([solicitud({ equipo: 'VIEJA' })]));
      });
      expect(screen.queryByText('VIEJA')).toBeNull();
      expect(screen.getByText('NUEVA')).toBeTruthy();
    });
  });

  describe('tomar solicitud', () => {
    it('un solo POST, botón deshabilitado «Tomando solicitud…», informa quién la atiende y recarga', async () => {
      const listar = colaFalsa([solicitud()], []);
      let terminar!: (s: SolicitudEnCola) => void;
      const tomar = vi
        .spyOn(container.ayuda.tomarSolicitud, 'ejecutar')
        .mockImplementation(() => new Promise((r) => (terminar = r)));
      montar();
      const boton = await screen.findByRole('button', {
        name: 'Tomar solicitud',
      });
      const antes = listar.mock.calls.length;

      await userEvent.dblClick(boton);
      expect(tomar).toHaveBeenCalledTimes(1);
      const tomando = screen.getByRole('button', {
        name: 'Tomando solicitud…',
      });
      expect((tomando as HTMLButtonElement).disabled).toBe(true);

      await act(async () => {
        terminar(solicitud({ estado: 'EN_ATENCION', atendidaPor: 'Ana' }));
      });
      expect(
        (await screen.findByRole('status', { name: '' })).textContent,
      ).toContain('ahora la atiende Ana');
      expect(listar.mock.calls.length).toBeGreaterThan(antes);
      expect(tomar).toHaveBeenCalledTimes(1);
    });

    it('409: informa que ya no está disponible, no reintenta y recarga', async () => {
      const listar = colaFalsa([solicitud()], []);
      const tomar = vi
        .spyOn(container.ayuda.tomarSolicitud, 'ejecutar')
        .mockRejectedValue(
          new SolicitudAyudaError(
            'Otro monitor ya está atendiendo esta solicitud.',
            'CONFLICTO',
            'SOLICITUD_YA_TOMADA',
            409,
          ),
        );
      montar();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Tomar solicitud' }),
      );
      const alerta = await screen.findByRole('alert');
      expect(alerta.textContent).toContain('ya no está disponible');
      expect(alerta.textContent).toContain('Otro monitor');
      expect(tomar).toHaveBeenCalledTimes(1);
      expect(
        listar.mock.calls.filter(([, c]) => c?.limite === 20).length,
      ).toBeGreaterThanOrEqual(2);
      expect(
        (
          screen.getByRole('button', {
            name: 'Tomar solicitud',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    it('timeout tras el POST: resultado incierto, no reenvía y consulta el estado', async () => {
      const listar = colaFalsa([solicitud()], []);
      const tomar = vi
        .spyOn(container.ayuda.tomarSolicitud, 'ejecutar')
        .mockRejectedValue(
          new SolicitudAyudaError(
            'timeout',
            'TIMEOUT',
            undefined,
            undefined,
            true,
          ),
        );
      montar();
      await userEvent.click(
        await screen.findByRole('button', { name: 'Tomar solicitud' }),
      );
      expect((await screen.findByRole('alert')).textContent).toContain(
        'No pudimos confirmar',
      );
      expect(tomar).toHaveBeenCalledTimes(1);
      expect(
        listar.mock.calls.filter(([, c]) => c?.limite === 20).length,
      ).toBeGreaterThanOrEqual(2);
    });
  });

  describe('resolver solicitud', () => {
    async function abrirDialogo() {
      colaFalsa([], [enAtencion]);
      montar();
      await screen.findByText('No hay solicitudes pendientes');
      await userEvent.click(
        screen.getByRole('button', { name: /^En atención/ }),
      );
      await userEvent.click(
        await screen.findByRole('button', { name: 'Marcar como resuelta' }),
      );
      return screen.getByRole('dialog');
    }

    it('limita el comentario a 500 caracteres y los cuenta', async () => {
      const dialogo = await abrirDialogo();
      const campo = within(dialogo).getByLabelText(
        /Comentario/,
      ) as HTMLTextAreaElement;
      expect(campo.maxLength).toBe(500);
      await userEvent.click(campo);
      await userEvent.paste('a'.repeat(600));
      expect(campo.value.length).toBe(500);
      expect(within(dialogo).getByText('500 / 500')).toBeTruthy();
    });

    it('éxito solo tras confirmar el servidor; un único envío; refresca', async () => {
      const dialogo = await abrirDialogo();
      let terminar!: (s: SolicitudEnCola) => void;
      const resolver = vi
        .spyOn(container.ayuda.resolverSolicitud, 'ejecutar')
        .mockImplementation(() => new Promise((r) => (terminar = r)));
      await userEvent.type(
        within(dialogo).getByLabelText(/Comentario/),
        'Se explicó',
      );
      const enviar = within(dialogo).getByRole('button', {
        name: 'Marcar como resuelta',
      });
      await userEvent.dblClick(enviar);
      expect(resolver).toHaveBeenCalledTimes(1);
      expect(resolver).toHaveBeenCalledWith('tok', 'id-2', 'Se explicó');
      expect(screen.queryByText(/quedó resuelta/)).toBeNull(); // sin éxito visual aún
      expect(within(dialogo).getByText('Resolviendo…')).toBeTruthy();

      await act(async () => {
        terminar(solicitud({ id: 'id-2', estado: 'RESUELTA' }));
      });
      expect(await screen.findByText(/quedó resuelta/)).toBeTruthy();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('403 de otro monitor: lo informa, cierra y recarga sin falsear estados', async () => {
      const dialogo = await abrirDialogo();
      vi.spyOn(container.ayuda.resolverSolicitud, 'ejecutar').mockRejectedValue(
        new SolicitudAyudaError(
          'La está atendiendo otro monitor.',
          'PERMISO',
          'SOLICITUD_DE_OTRO_MONITOR',
          403,
        ),
      );
      await userEvent.click(
        within(dialogo).getByRole('button', { name: 'Marcar como resuelta' }),
      );
      expect((await screen.findByRole('alert')).textContent).toContain(
        'Otro monitor es responsable',
      );
      expect(screen.queryByText(/quedó resuelta/)).toBeNull();
      expect(screen.getByText('Luis Díaz')).toBeTruthy();
    });

    it('409 SOLICITUD_CERRADA: no hay éxito y se informa', async () => {
      const dialogo = await abrirDialogo();
      vi.spyOn(container.ayuda.resolverSolicitud, 'ejecutar').mockRejectedValue(
        new SolicitudAyudaError(
          'Ya se cerró.',
          'CONFLICTO',
          'SOLICITUD_CERRADA',
          409,
        ),
      );
      await userEvent.click(
        within(dialogo).getByRole('button', { name: 'Marcar como resuelta' }),
      );
      expect((await screen.findByRole('alert')).textContent).toContain(
        'ya no está disponible',
      );
    });

    it('error de red deja el diálogo abierto con mensaje y sin reenviar', async () => {
      const dialogo = await abrirDialogo();
      const resolver = vi
        .spyOn(container.ayuda.resolverSolicitud, 'ejecutar')
        .mockRejectedValue(
          new SolicitudAyudaError(
            'red',
            'CONEXION',
            undefined,
            undefined,
            true,
          ),
        );
      await userEvent.click(
        within(dialogo).getByRole('button', { name: 'Marcar como resuelta' }),
      );
      expect((await screen.findByRole('alert')).textContent).toContain(
        'No pudimos confirmar',
      );
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(resolver).toHaveBeenCalledTimes(1);
    });
  });

  describe('polling cada 15 s', () => {
    const vaciar = () =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
    const avanzar = (ms: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });

    beforeEach(() => vi.useFakeTimers());

    it('consulta al montar, de nuevo a los 15 s y no antes; sin intervalos duplicados', async () => {
      const listar = colaFalsa([solicitud()], []);
      montar();
      await vaciar();
      expect(llamadasDe(listar, 'PENDIENTE')).toHaveLength(1);

      await avanzar(14_999);
      expect(llamadasDe(listar, 'PENDIENTE')).toHaveLength(1);
      await avanzar(1);
      expect(llamadasDe(listar, 'PENDIENTE')).toHaveLength(2);

      await avanzar(15_000);
      expect(llamadasDe(listar, 'PENDIENTE')).toHaveLength(3);
    });

    it('un re-render por otros cambios (abrir diálogo, aviso) no duplica peticiones', async () => {
      colaFalsa([], [enAtencion]);
      const listar = vi.mocked(container.ayuda.listarSolicitudes.ejecutar);
      montar();
      await vaciar();
      const inicial = listar.mock.calls.length;
      fireEvent.click(screen.getByRole('button', { name: /^En atención/ }));
      await vaciar();
      const trasPestana = listar.mock.calls.length;
      expect(trasPestana).toBe(inicial + 2); // una consulta nueva (principal + contador)
      fireEvent.click(
        screen.getByRole('button', { name: 'Marcar como resuelta' }),
      );
      await vaciar();
      expect(listar.mock.calls.length).toBe(trasPestana);
    });

    it('si una consulta sigue en vuelo, el tick no abre otra', async () => {
      let soltar!: () => void;
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockImplementation(
          () => new Promise((r) => (soltar = () => r(pagina([])))),
        );
      montar();
      await vaciar();
      const inicial = listar.mock.calls.length;
      await avanzar(45_000);
      expect(listar.mock.calls.length).toBe(inicial);
      soltar();
    });

    it('al desmontar se cancela el polling y no se actualiza estado', async () => {
      const listar = colaFalsa([solicitud()], []);
      const { unmount } = montar();
      await vaciar();
      const antes = listar.mock.calls.length;
      unmount();
      await avanzar(60_000);
      expect(listar.mock.calls.length).toBe(antes);
    });

    it('respeta filtro y página en cada tick', async () => {
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockResolvedValue({
          datos: [solicitud()],
          total: 45,
          pagina: 1,
          limite: 20,
        });
      montar();
      await vaciar();
      fireEvent.change(screen.getByLabelText('Tema'), {
        target: { value: 'IMPRESION' },
      });
      await vaciar();
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      await vaciar();
      await avanzar(15_000);
      const ultima = listar.mock.calls
        .filter(([, c]) => c?.limite === 20)
        .at(-1);
      expect(ultima?.[1]).toMatchObject({
        estado: 'PENDIENTE',
        tema: 'IMPRESION',
        pagina: 2,
      });
    });

    it('un fallo de red en un tick conserva lo mostrado, avisa y se recupera en el siguiente', async () => {
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockResolvedValue(pagina([solicitud({ equipo: 'ABC' })]));
      montar();
      await vaciar();
      expect(screen.getByText('ABC')).toBeTruthy();

      listar.mockRejectedValue(
        new SolicitudAyudaError('Sin conexión.', 'CONEXION'),
      );
      await avanzar(15_000);
      expect(screen.getByText('ABC')).toBeTruthy();
      expect(screen.getByRole('alert').textContent).toContain('Sin conexión.');

      listar.mockResolvedValue(pagina([solicitud({ equipo: 'XYZ' })]));
      await avanzar(15_000);
      expect(screen.getByText('XYZ')).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('el polling no vuelve a mostrar «Cargando…» (sin parpadeos)', async () => {
      colaFalsa([solicitud()], []);
      montar();
      await vaciar();
      expect(screen.queryByText('Cargando solicitudes…')).toBeNull();
      await avanzar(15_000);
      expect(screen.queryByText('Cargando solicitudes…')).toBeNull();
      expect(screen.getByText('Tomar solicitud')).toBeTruthy();
    });

    it('si la sesión expira (401) deja de consultar', async () => {
      const listar = vi
        .spyOn(container.ayuda.listarSolicitudes, 'ejecutar')
        .mockResolvedValueOnce(pagina([solicitud()]))
        .mockResolvedValueOnce(pagina([]))
        .mockRejectedValue(
          new SolicitudAyudaError('x', 'SESION', undefined, 401),
        );
      montar();
      await vaciar();
      await avanzar(15_000);
      const tras401 = listar.mock.calls.length;
      await avanzar(60_000);
      expect(listar.mock.calls.length).toBe(tras401);
    });
  });
});
