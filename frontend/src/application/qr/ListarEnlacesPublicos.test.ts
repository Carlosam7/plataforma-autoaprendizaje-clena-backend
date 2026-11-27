import { describe, expect, it, vi } from 'vitest';
import { ListarEnlacesPublicos } from './ListarEnlacesPublicos';
import type { EnlacesPublicosRepository } from './ports';
import { UrlPublicaInvalidaError } from '@/domain/qr/types';

function repositorio(): EnlacesPublicosRepository {
  return {
    listarCategorias: vi.fn().mockResolvedValue([
      { slug: 'seguridad-digital', nombre: 'Seguridad digital' },
      { slug: 'correo-electronico', nombre: 'Correo electrónico' },
    ]),
    listarGuias: vi.fn(async (categoria: string) =>
      categoria === 'seguridad-digital'
        ? [
            { slug: 'smishing', titulo: 'Smishing' },
            { slug: 'vishing', titulo: 'Vishing' },
          ]
        : [],
    ),
  };
}

describe('FE-11 · ListarEnlacesPublicos (HU-45)', () => {
  it('arma el inicio, cada categoría y cada guía con la URL pública', async () => {
    const res = await new ListarEnlacesPublicos(repositorio()).ejecutar(
      'https://kama.clena.example/',
    );
    expect(res.urlBase).toBe('https://kama.clena.example');
    expect(res.esLocal).toBe(false);
    expect(res.enlaces).toEqual([
      {
        tipo: 'INICIO',
        titulo: 'Inicio de Kamá',
        ruta: '/',
        url: 'https://kama.clena.example/',
      },
      {
        tipo: 'CATEGORIA',
        titulo: 'Seguridad digital',
        ruta: '/guias?categoria=seguridad-digital',
        url: 'https://kama.clena.example/guias?categoria=seguridad-digital',
      },
      {
        tipo: 'GUIA',
        titulo: 'Smishing',
        ruta: '/guias/smishing',
        url: 'https://kama.clena.example/guias/smishing',
      },
      {
        tipo: 'GUIA',
        titulo: 'Vishing',
        ruta: '/guias/vishing',
        url: 'https://kama.clena.example/guias/vishing',
      },
      {
        tipo: 'CATEGORIA',
        titulo: 'Correo electrónico',
        ruta: '/guias?categoria=correo-electronico',
        url: 'https://kama.clena.example/guias?categoria=correo-electronico',
      },
    ]);
  });

  it('nunca incluye rutas del personal ni de la cuenta', async () => {
    const { enlaces } = await new ListarEnlacesPublicos(repositorio()).ejecutar(
      'https://kama.clena.example',
    );
    expect(
      enlaces.filter((e) =>
        /personal|admin|cuenta|sesion|registro/.test(e.ruta),
      ),
    ).toEqual([]);
  });

  it('conserva una ruta base, sin la barra final', async () => {
    const res = await new ListarEnlacesPublicos(repositorio()).ejecutar(
      'https://clena.example/kama/',
    );
    expect(res.urlBase).toBe('https://clena.example/kama');
    expect(res.enlaces[2].url).toBe(
      'https://clena.example/kama/guias/smishing',
    );
  });

  it.each([
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://[::1]:8080',
  ])('marca %s como local: no se debe imprimir', async (url) => {
    const res = await new ListarEnlacesPublicos(repositorio()).ejecutar(url);
    expect(res.esLocal).toBe(true);
  });

  it.each(['', 'kama.clena.example', 'ftp://kama.example'])(
    'rechaza la URL pública «%s»',
    async (url) => {
      await expect(
        new ListarEnlacesPublicos(repositorio()).ejecutar(url),
      ).rejects.toBeInstanceOf(UrlPublicaInvalidaError);
    },
  );
});
