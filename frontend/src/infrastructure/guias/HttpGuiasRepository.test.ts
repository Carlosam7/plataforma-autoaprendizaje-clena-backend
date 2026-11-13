import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpGuiasRepository } from './HttpGuiasRepository';

describe('HttpGuiasRepository', () => {
  let repository: HttpGuiasRepository;

  beforeEach(() => {
    repository = new HttpGuiasRepository('/api/v1');
    vi.restoreAllMocks();
  });

  it('listarGuiasPublicadas realiza GET y mapea los datos del backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datos: [
          {
            slug: 'smishing',
            categoria: 'seguridad-digital',
            titulo: 'Smishing',
            objetivo: 'Al terminar sabrás reconocer un SMS falso.',
            nivel: 'BASICO',
            duracionEstimadaMin: 8,
          },
        ],
        total: 1,
        pagina: 1,
        limite: 20,
      }),
    } as Response);

    const guias = await repository.listarGuiasPublicadas('seguridad-digital');
    expect(guias).toHaveLength(1);
    expect(guias[0].slug).toBe('smishing');
    expect(guias[0].titulo).toBe('Smishing');
    expect(guias[0].nivel).toBe('Básico');
    expect(guias[0].duracionEstimadaMinutos).toBe(8);
  });

  it('obtenerDetalleGuia realiza GET y mapea pasos y bloques del backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        slug: 'smishing',
        categoria: 'seguridad-digital',
        titulo: 'Smishing',
        objetivo: 'Al terminar sabrás reconocer un SMS falso.',
        nivel: 'BASICO',
        duracionEstimadaMin: 8,
        totalPasos: 2,
        tieneActividad: true,
        pasos: [
          {
            orden: 1,
            titulo: 'Haz una pausa',
            bloques: [
              { tipo: 'texto', texto: 'Respira y lee con calma.' },
              { tipo: 'aviso', nivel: 'alerta', texto: 'No abras el enlace.' },
            ],
          },
        ],
      }),
    } as Response);

    const detalle = await repository.obtenerDetalleGuia('smishing');
    expect(detalle).not.toBeNull();
    expect(detalle?.guia.slug).toBe('smishing');
    expect(detalle?.totalPasos).toBe(2);
    expect(detalle?.tieneActividad).toBe(true);
    expect(detalle?.pasos).toHaveLength(1);
    expect(detalle?.pasos[0].titulo).toBe('Haz una pausa');
    expect(detalle?.pasos[0].contenido).toBe('Respira y lee con calma.');
    expect(detalle?.pasos[0].recordatorio?.consejo).toBe('No abras el enlace.');
  });

  it('obtenerDetalleGuia devuelve null si el backend responde 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const detalle = await repository.obtenerDetalleGuia('no-existe');
    expect(detalle).toBeNull();
  });

  it('registrarAperturaGuia invoca POST /guias/:slug/consultas', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    await repository.registrarAperturaGuia('smishing');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/guias/smishing/consultas',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
  });
});
