import { describe, expect, it, vi } from 'vitest';
import type { DetalleGuia, Guia } from '../../domain/guias/types';
import { CalcularResultadoPractica } from './CalcularResultadoPractica';
import { ListarCategorias } from './ListarCategorias';
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
      listarCategorias: vi.fn(),
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

  it('ListarCategorias: devuelve las categorías del repositorio', async () => {
    const categoriasMock = [
      { slug: 'seguridad-digital', nombre: 'Seguridad digital' },
      { slug: 'correo-electronico', nombre: 'Correo electrónico' },
    ];
    const repo: GuiasRepository = {
      listarCategorias: vi.fn().mockResolvedValue(categoriasMock),
      obtenerCategoria: vi.fn(),
      listarGuiasPublicadas: vi.fn(),
      obtenerDetalleGuia: vi.fn(),
      registrarAperturaGuia: vi.fn(),
    };

    const usecase = new ListarCategorias(repo);
    const resultado = await usecase.ejecutar();

    expect(resultado).toEqual(categoriasMock);
    expect(repo.listarCategorias).toHaveBeenCalledOnce();
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
      listarCategorias: vi.fn(),
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
    expect(res1.aprobado).toBe(true);
    expect(res1.aprobada).toBe(true);

    // 3 de 5 = 60% -> No aprobada
    const res2 = usecase.ejecutar({
      guiaSlug: 'smishing',
      totalPreguntas: 5,
      aciertos: 3,
    });
    expect(res2.porcentaje).toBe(60);
    expect(res2.aprobado).toBe(false);
    expect(res2.aprobada).toBe(false);
  });

  it('CalcularResultadoPractica: cubre 0/N, 69 %, 70 % exacto, 100 % y distintos tamaños sin redondear a favor', () => {
    const usecase = new CalcularResultadoPractica();

    expect(
      usecase.ejecutar({
        guiaSlug: 'smishing',
        totalPreguntas: 5,
        respuestasCorrectas: 0,
      }),
    ).toMatchObject({
      respuestasCorrectas: 0,
      totalPreguntas: 5,
      porcentaje: 0,
      aprobado: false,
      porcentajeAprobacion: 70,
    });

    // 69 % exacto con umbral 70 % -> no aprobado
    expect(
      usecase.ejecutar({
        guiaSlug: 'smishing',
        totalPreguntas: 100,
        respuestasCorrectas: 69,
        porcentajeAprobacion: 70,
      }),
    ).toMatchObject({
      porcentaje: 69,
      aprobado: false,
    });

    // 139/200 = 69.5 % (Math.round daría 70 %) -> NO aprueba porque 139*100 < 70*200
    expect(
      usecase.ejecutar({
        guiaSlug: 'smishing',
        totalPreguntas: 200,
        respuestasCorrectas: 139,
        porcentajeAprobacion: 70,
      }),
    ).toMatchObject({
      porcentaje: 70,
      aprobado: false,
    });

    // 70 % exacto -> aprobado
    expect(
      usecase.ejecutar({
        guiaSlug: 'smishing',
        totalPreguntas: 10,
        respuestasCorrectas: 7,
        porcentajeAprobacion: 70,
      }),
    ).toMatchObject({
      respuestasCorrectas: 7,
      totalPreguntas: 10,
      porcentaje: 70,
      aprobado: true,
    });

    // 100 % en actividades de 1, 3 y 10 preguntas
    for (const total of [1, 3, 10]) {
      expect(
        usecase.ejecutar({
          guiaSlug: 'smishing',
          totalPreguntas: total,
          respuestasCorrectas: total,
        }),
      ).toMatchObject({
        respuestasCorrectas: total,
        totalPreguntas: total,
        porcentaje: 100,
        aprobado: true,
      });
    }
  });

  it('CalcularResultadoPractica.desdeCalificacion: preserva exactamente los datos de C-03', () => {
    const usecase = new CalcularResultadoPractica();
    const res = usecase.desdeCalificacion('smishing', {
      respuestasCorrectas: 2,
      totalPreguntas: 3,
      porcentaje: 67,
      aprobado: false,
      porcentajeAprobacion: 70,
    });
    expect(res).toEqual({
      guiaSlug: 'smishing',
      respuestasCorrectas: 2,
      aciertos: 2,
      totalPreguntas: 3,
      porcentaje: 67,
      aprobado: false,
      aprobada: false,
      porcentajeAprobacion: 70,
      umbralAprobacion: 70,
    });
  });
});
