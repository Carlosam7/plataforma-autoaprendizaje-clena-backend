import { describe, expect, it, vi } from 'vitest';
import {
  GuardarGuia,
  GuiaInvalidaError,
  ListarGuiasGestion,
  PublicarGuia,
} from './casos';
import type { GestionGuiasRepository } from './ports';
import {
  type GuardarGuiaComando,
  type GuiaGestionDetalle,
  validarGuia,
} from '@/domain/gestion/types';

const DETALLE = {
  slug: 'smishing',
  totalPasos: 1,
} as GuiaGestionDetalle;

function repositorio(): GestionGuiasRepository {
  return {
    listar: vi.fn(async () => ({
      datos: [],
      total: 0,
      pagina: 1,
      limite: 100,
    })),
    obtener: vi.fn(async () => DETALLE),
    crear: vi.fn(async () => DETALLE),
    editar: vi.fn(async () => DETALLE),
    publicar: vi.fn(async () => DETALLE),
    ocultar: vi.fn(async () => DETALLE),
  };
}

const VALIDA: GuardarGuiaComando = {
  titulo: 'Smishing',
  objetivo: 'Reconocer mensajes falsos.',
  descripcion: '',
  categoria: 'seguridad-digital',
  nivel: 'BASICO',
  duracionEstimadaMin: 8,
  palabrasClave: [],
  pasos: [{ titulo: '', bloques: [{ tipo: 'texto', texto: 'Revisa.' }] }],
};

describe('FE-05 · gestión de guías (HU-13, HU-15)', () => {
  it('lista por defecto de la editada más recientemente, hasta 100', async () => {
    const repo = repositorio();
    await new ListarGuiasGestion(repo).ejecutar({ estado: 'BORRADOR' });
    expect(repo.listar).toHaveBeenCalledWith({
      ordenarPor: 'actualizadoEn',
      direccion: 'desc',
      limite: 100,
      estado: 'BORRADOR',
    });
  });

  describe('GuardarGuia', () => {
    it('sin slug crea; con slug edita, y limpia lo que no necesita el backend', async () => {
      const repo = repositorio();
      await new GuardarGuia(repo).ejecutar({
        ...VALIDA,
        titulo: '  Smishing  ',
        descripcion: '   ',
        palabrasClave: [' sms ', ''],
        pasos: [
          {
            id: 'p-1',
            titulo: '  ',
            bloques: [
              {
                tipo: 'imagen',
                imagenId: 'img-1',
                textoAlternativo: ' Captura ',
                url: '/api/v1/archivos/x.png',
              },
            ],
          },
        ],
      });
      expect(repo.crear).toHaveBeenCalledWith({
        ...VALIDA,
        titulo: 'Smishing',
        descripcion: null,
        palabrasClave: ['sms'],
        pasos: [
          {
            id: 'p-1',
            titulo: null,
            bloques: [
              {
                tipo: 'imagen',
                imagenId: 'img-1',
                textoAlternativo: 'Captura',
              },
            ],
          },
        ],
      });

      await new GuardarGuia(repo).ejecutar(VALIDA, 'smishing');
      expect(repo.editar).toHaveBeenCalledWith('smishing', expect.anything());
    });

    it('con datos inválidos no llama al servidor y devuelve todos los errores', async () => {
      const repo = repositorio();
      const error = await new GuardarGuia(repo)
        .ejecutar({
          ...VALIDA,
          titulo: '',
          categoria: '',
          duracionEstimadaMin: 0,
          pasos: [{ titulo: '', bloques: [] }],
        })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(GuiaInvalidaError);
      expect((error as GuiaInvalidaError).errores.map((e) => e.campo)).toEqual([
        'titulo',
        'categoria',
        'duracionEstimadaMin',
        'paso-1',
      ]);
      expect(repo.crear).not.toHaveBeenCalled();
    });
  });

  it('no deja publicar una guía sin pasos', async () => {
    const repo = repositorio();
    await expect(
      new PublicarGuia(repo).ejecutar({ ...DETALLE, totalPasos: 0 }),
    ).rejects.toMatchObject({ codigo: 'GUIA_SIN_PASOS' });
    expect(repo.publicar).not.toHaveBeenCalled();
    await new PublicarGuia(repo).ejecutar(DETALLE);
    expect(repo.publicar).toHaveBeenCalledWith('smishing');
  });

  describe('validarGuia (mismas reglas que el backend, C-07)', () => {
    it.each([
      [
        { titulo: 'x'.repeat(151) },
        'titulo',
        'El título puede tener máximo 150 letras.',
      ],
      [{ objetivo: '   ' }, 'objetivo', 'Escribe el objetivo.'],
      [
        { descripcion: 'x'.repeat(2001) },
        'descripcion',
        'La descripción puede tener máximo 2000 letras.',
      ],
      [
        { duracionEstimadaMin: 601 },
        'duracionEstimadaMin',
        expect.stringContaining('entre 1 y 600'),
      ],
      [
        { duracionEstimadaMin: 7.5 },
        'duracionEstimadaMin',
        expect.stringContaining('número entero'),
      ],
      [
        { palabrasClave: Array(16).fill('a') },
        'palabrasClave',
        'Escribe máximo 15 palabras clave.',
      ],
      [
        { palabrasClave: ['x'.repeat(41)] },
        'palabrasClave',
        expect.stringContaining('40 letras'),
      ],
    ])('%o → %s', (cambio, campo, mensaje) => {
      expect(validarGuia({ ...VALIDA, ...cambio })).toEqual([
        { campo, mensaje },
      ]);
    });

    it('revisa cada paso: bloques vacíos, máximo 10 y texto de la imagen', () => {
      const errores = validarGuia({
        ...VALIDA,
        pasos: [
          { titulo: null, bloques: [{ tipo: 'texto', texto: '  ' }] },
          {
            titulo: null,
            bloques: Array(11).fill({ tipo: 'texto', texto: 'a' }),
          },
          {
            titulo: null,
            bloques: [{ tipo: 'imagen', imagenId: 'i', textoAlternativo: '' }],
          },
        ],
      });
      expect(errores.map((e) => e.campo)).toEqual([
        'paso-1',
        'paso-2',
        'paso-3',
      ]);
      expect(errores[2].mensaje).toContain('describe cada imagen');
    });

    it('una guía válida no tiene errores', () => {
      expect(validarGuia(VALIDA)).toEqual([]);
    });
  });
});
