import { describe, expect, it, vi } from 'vitest';
import type { DetalleGuia, Guia } from '../../domain/guias/types';
import { CalcularResultadoPractica } from './CalcularResultadoPractica';
import { ListarGuias } from './ListarGuias';
import { ObtenerDetalleGuia } from './ObtenerDetalleGuia';
import type { GuiasRepository } from './ports';

describe('Guias use cases', () => {
  const guiasMock: Guia[] = [
    {
      slug: 'smishing',
      numero: '01',
      titulo: 'Smishing',
      subtitulo: 'Mensajes falsos por SMS o WhatsApp',
      descripcion: 'Mensajes falsos por SMS o WhatsApp.',
      duracionEstimadaMinutos: 8,
      nivel: 'Básico',
      estado: 'PUBLICADA',
      categoriaSlug: 'phishing',
      objetivo: 'Aprender a reconocer las señales de un mensaje engañoso.',
    },
    {
      slug: 'vishing',
      numero: '02',
      titulo: 'Vishing',
      subtitulo: 'Llamadas telefónicas que buscan engañarte',
      descripcion: 'Llamadas telefónicas que buscan engañarte.',
      duracionEstimadaMinutos: 7,
      nivel: 'Básico',
      estado: 'PUBLICADA',
      categoriaSlug: 'phishing',
      objetivo:
        'Identificar cuando una llamada pretende sacarte datos o códigos.',
    },
    {
      slug: 'guia-borrador',
      numero: '99',
      titulo: 'Borrador',
      subtitulo: 'Aún no lista',
      descripcion: 'En preparación.',
      duracionEstimadaMinutos: 5,
      nivel: 'Básico',
      estado: 'BORRADOR',
      categoriaSlug: 'phishing',
      objetivo: 'Objetivo borrador.',
    },
  ];

  it('ListarGuias: solo devuelve guías publicadas (AC-HU09-02)', async () => {
    const repo: GuiasRepository = {
      obtenerCategoria: vi.fn(),
      listarGuiasPublicadas: vi.fn().mockResolvedValue(guiasMock),
      obtenerDetalleGuia: vi.fn(),
      registrarAperturaGuia: vi.fn(),
    };

    const usecase = new ListarGuias(repo);
    const resultado = await usecase.ejecutar('phishing');

    expect(resultado).toHaveLength(2);
    expect(resultado.map((g) => g.slug)).toEqual(['smishing', 'vishing']);
  });

  it('ObtenerDetalleGuia: retorna el detalle y registra la apertura (AC-HU10-05)', async () => {
    const detalleMock: DetalleGuia = {
      guia: guiasMock[0],
      totalPasos: 1,
      tieneActividad: false,
      pasos: [
        {
          numero: 1,
          titulo: '01 / Haz una pausa',
          contenido: 'Un mensaje puede parecer de tu banco y no serlo.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo: 'No tienes que responder de inmediato.',
          },
        },
      ],
      preguntas: [],
    };

    const repo: GuiasRepository = {
      obtenerCategoria: vi.fn(),
      listarGuiasPublicadas: vi.fn(),
      obtenerDetalleGuia: vi.fn().mockResolvedValue(detalleMock),
      registrarAperturaGuia: vi.fn().mockResolvedValue(undefined),
    };

    const usecase = new ObtenerDetalleGuia(repo);
    const resultado = await usecase.ejecutar('smishing');

    expect(resultado).toEqual(detalleMock);
    expect(repo.registrarAperturaGuia).toHaveBeenCalledWith('smishing');
  });

  it('CalcularResultadoPractica: aprueba con 70% o más (AC-HU21-04)', () => {
    const usecase = new CalcularResultadoPractica();

    // 4 de 5 = 80% -> Aprobada
    const res1 = usecase.ejecutar({
      guiaSlug: 'smishing',
      totalPreguntas: 5,
      aciertos: 4,
    });
    expect(res1.porcentaje).toBe(80);
    expect(res1.aprobada).toBe(true);

    // 3 de 5 = 60% -> No aprobada
    const res2 = usecase.ejecutar({
      guiaSlug: 'smishing',
      totalPreguntas: 5,
      aciertos: 3,
    });
    expect(res2.porcentaje).toBe(60);
    expect(res2.aprobada).toBe(false);
  });
});
