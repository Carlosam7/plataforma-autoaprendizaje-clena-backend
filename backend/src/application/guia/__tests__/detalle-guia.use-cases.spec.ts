import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConsultaGuia,
  ConsultaGuiaRepository,
} from '../../../domain/guia/consulta-guia.repository.js';
import { ContenidoPaso } from '../../../domain/guia/contenido-paso.js';
import { GuiaNoEncontradaError } from '../../../domain/guia/errores.js';
import { Guia } from '../../../domain/guia/guia.js';
import {
  DetalleGuia,
  GuiaRepository,
} from '../../../domain/guia/guia.repository.js';
import { ImagenRepository } from '../../../domain/imagen/imagen.repository.js';
import { RelojFijo } from '../../auth/__tests__/fakes.js';
import { ObtenerGuiaUseCase } from '../obtener-guia.use-case.js';
import { RegistrarConsultaGuiaUseCase } from '../registrar-consulta-guia.use-case.js';

/** Solo guarda guías publicadas: las demás, para el público, no existen. */
class GuiaRepositoryEnMemoria extends GuiaRepository {
  publicadas = new Map<string, DetalleGuia>();
  listarPublicadas(): never {
    throw new Error('no se usa en estas pruebas');
  }
  buscarPublicada(slug: string): Promise<DetalleGuia | null> {
    return Promise.resolve(this.publicadas.get(slug) ?? null);
  }
  buscarIdPublicada(slug: string): Promise<string | null> {
    return Promise.resolve(this.publicadas.get(slug)?.guia.id ?? null);
  }
}

class ImagenRepositoryEnMemoria extends ImagenRepository {
  consultas = 0;
  constructor(private readonly urls: Record<string, string>) {
    super();
  }
  urlsPorId(ids: readonly string[]): Promise<Map<string, string>> {
    this.consultas += 1;
    return Promise.resolve(
      new Map(
        ids.filter((id) => this.urls[id]).map((id) => [id, this.urls[id]]),
      ),
    );
  }
}

class ConsultaGuiaRepositoryEnMemoria extends ConsultaGuiaRepository {
  registradas: ConsultaGuia[] = [];
  registrar(consulta: ConsultaGuia): Promise<void> {
    this.registradas.push(consulta);
    return Promise.resolve();
  }
}

const smishing = new Guia(
  'guia-1',
  'smishing',
  'seguridad-digital',
  'Smishing',
  'Al terminar sabrás reconocer un SMS falso.',
  'BASICO',
  8,
  'PUBLICADA',
);

function contenido(...bloques: unknown[]): ContenidoPaso {
  return ContenidoPaso.desdeJson({ version: 1, bloques });
}

describe('HU-10 · Seguir una guía paso a paso', () => {
  let guias: GuiaRepositoryEnMemoria;
  let imagenes: ImagenRepositoryEnMemoria;

  beforeEach(() => {
    guias = new GuiaRepositoryEnMemoria();
    imagenes = new ImagenRepositoryEnMemoria({
      'img-1': '/api/v1/archivos/semilla/guias/smishing-1.png',
    });
    guias.publicadas.set('smishing', {
      guia: smishing,
      tieneActividad: true,
      pasos: [
        {
          orden: 1,
          titulo: 'Haz una pausa',
          contenido: contenido(
            { tipo: 'texto', texto: 'Si te piden actuar ya, detente.' },
            { tipo: 'imagen', imagenId: 'img-1', textoAlternativo: 'Un SMS' },
            { tipo: 'aviso', nivel: 'consejo', texto: 'Respira.' },
          ),
        },
        {
          orden: 2,
          titulo: null,
          contenido: contenido({
            tipo: 'texto',
            texto: 'Revisa quién escribe.',
          }),
        },
      ],
    });
  });

  describe('ObtenerGuia', () => {
    it('devuelve el objetivo, el total de pasos y cada paso con la URL de su imagen', async () => {
      const detalle = await new ObtenerGuiaUseCase(guias, imagenes).ejecutar(
        'smishing',
      );

      expect(detalle).toEqual({
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
              { tipo: 'texto', texto: 'Si te piden actuar ya, detente.' },
              {
                tipo: 'imagen',
                url: '/api/v1/archivos/semilla/guias/smishing-1.png',
                textoAlternativo: 'Un SMS',
              },
              { tipo: 'aviso', nivel: 'consejo', texto: 'Respira.' },
            ],
          },
          {
            orden: 2,
            titulo: null,
            bloques: [{ tipo: 'texto', texto: 'Revisa quién escribe.' }],
          },
        ],
      });
      expect(imagenes.consultas).toBe(1);
    });

    it('si la imagen ya no existe, el paso se muestra sin ella', async () => {
      const sinImagenes = new ImagenRepositoryEnMemoria({});
      const detalle = await new ObtenerGuiaUseCase(guias, sinImagenes).ejecutar(
        'smishing',
      );
      expect(detalle.pasos[0].bloques.map((b) => b.tipo)).toEqual([
        'texto',
        'aviso',
      ]);
    });

    it('una guía sin imágenes no consulta el almacén de imágenes', async () => {
      guias.publicadas.get('smishing')!.pasos.shift();
      await new ObtenerGuiaUseCase(guias, imagenes).ejecutar('smishing');
      expect(imagenes.consultas).toBe(0);
    });

    it('responde «No encontramos esa guía» si no existe o no está publicada', async () => {
      await expect(
        new ObtenerGuiaUseCase(guias, imagenes).ejecutar('borrador'),
      ).rejects.toThrow(GuiaNoEncontradaError);
    });
  });

  describe('RegistrarConsultaGuia', () => {
    let consultas: ConsultaGuiaRepositoryEnMemoria;
    let registrar: RegistrarConsultaGuiaUseCase;
    const ahora = new Date('2026-11-13T15:00:00Z');

    beforeEach(() => {
      consultas = new ConsultaGuiaRepositoryEnMemoria();
      registrar = new RegistrarConsultaGuiaUseCase(
        guias,
        consultas,
        new RelojFijo(ahora),
      );
    });

    it('sin sesión registra la apertura sin datos personales', async () => {
      await registrar.ejecutar('smishing', null);
      expect(consultas.registradas).toEqual([
        { guiaId: 'guia-1', usuarioId: null, consultadaEn: ahora },
      ]);
    });

    it('con sesión de usuario público la asocia a su cuenta', async () => {
      await registrar.ejecutar('smishing', {
        id: '41234567',
        rol: 'USUARIO_PUBLICO',
      });
      expect(consultas.registradas[0].usuarioId).toBe('41234567');
    });

    it('con sesión del personal queda anónima', async () => {
      await registrar.ejecutar('smishing', { id: 'uuid', rol: 'PERSONAL' });
      expect(consultas.registradas[0].usuarioId).toBeNull();
    });

    it('no registra nada si la guía no existe o no está publicada', async () => {
      await expect(registrar.ejecutar('borrador', null)).rejects.toThrow(
        GuiaNoEncontradaError,
      );
      expect(consultas.registradas).toEqual([]);
    });
  });
});
