import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpAuthRepository } from './HttpAuthRepository';
import {
  AuthConflictError,
  AuthExpiredError,
  AuthRateLimitError,
  AuthValidationError,
} from '@/domain/auth/errors';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, value);
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('HttpAuthRepository', () => {
  let repository: HttpAuthRepository;

  beforeEach(() => {
    repository = new HttpAuthRepository('/api/v1');
    vi.restoreAllMocks();
    storageMap.clear();
  });

  it('obtenerAvisoPrivacidad realiza GET y devuelve datos formateados', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        version: '1.0',
        contenido: 'Términos de prueba',
        vigenteDesde: '2026-01-01T00:00:00.000Z',
      }),
    } as Response);

    const resultado = await repository.obtenerAvisoPrivacidad();
    expect(resultado.version).toBe('1.0');
    expect(resultado.contenido).toBe('Términos de prueba');
    expect(resultado.vigenteDesde).toBeInstanceOf(Date);
  });

  it('solicitarRegistro realiza POST y mapea respuesta de éxito', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        registroId: 'abc-123',
        canal: 'CORREO',
        destino: 'c****@correo.com',
        mensaje: 'Código enviado',
        expiraEn: '2026-01-01T00:10:00.000Z',
        puedeReenviarEn: '2026-01-01T00:01:00.000Z',
      }),
    } as Response);

    const resultado = await repository.solicitarRegistro({
      nombre: 'Carmen Rodríguez',
      numeroIdentificacion: '12345678',
      fechaNacimiento: '1955-08-21',
      correo: 'carmen@correo.com',
      aceptaAvisoPrivacidad: true,
    });

    expect(resultado.registroId).toBe('abc-123');
    expect(resultado.destino).toBe('c****@correo.com');
  });

  it('lanza AuthConflictError cuando el servidor responde 409', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        statusCode: 409,
        error: 'Conflict',
        message: 'Identificación ya registrada',
      }),
    } as Response);

    await expect(
      repository.solicitarRegistro({
        nombre: 'Carmen Rodríguez',
        numeroIdentificacion: '12345678',
        fechaNacimiento: '1955-08-21',
        correo: 'carmen@correo.com',
        aceptaAvisoPrivacidad: true,
      }),
    ).rejects.toThrow(AuthConflictError);
  });

  it('lanza AuthExpiredError cuando el servidor responde 410', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: async () => ({
        statusCode: 410,
        message: 'El código venció',
      }),
    } as Response);

    await expect(
      repository.verificarRegistro({
        registroId: 'abc-123',
        codigo: '123456',
      }),
    ).rejects.toThrow(AuthExpiredError);
  });

  it('lanza AuthRateLimitError cuando el servidor responde 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        statusCode: 429,
        message: 'Se agotaron los intentos',
      }),
    } as Response);

    await expect(repository.reenviarCodigo('abc-123')).rejects.toThrow(
      AuthRateLimitError,
    );
  });

  it('lanza AuthValidationError cuando el servidor responde 400', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        statusCode: 400,
        message: 'Código incorrecto',
      }),
    } as Response);

    await expect(
      repository.verificarRegistro({
        registroId: 'abc-123',
        codigo: '000000',
      }),
    ).rejects.toThrow(AuthValidationError);
  });

  it('guarda, recupera y cierra la sesión llamando a /auth/logout con credentials', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    const sesion = {
      usuario: { nombre: 'Carmen', rol: 'USUARIO_PUBLICO' },
      accessToken: 'token-abc',
    };

    await repository.guardarSesion(sesion);
    const obtenida = await repository.obtenerSesion();
    expect(obtenida).toEqual(sesion);

    await repository.cerrarSesion();
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/logout',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    const despuesDeCerrar = await repository.obtenerSesion();
    expect(despuesDeCerrar).toBeNull();
  });

  it('renovarSesion llama a /auth/refresh con credentials y rota el token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: 'nuevo-access-token',
        accessTokenExpiraEn: '2026-01-01T01:00:00.000Z',
        refreshTokenExpiraEn: '2026-01-08T00:00:00.000Z',
      }),
    } as Response);

    await repository.guardarSesion({
      usuario: { nombre: 'Carmen', rol: 'USUARIO_PUBLICO' },
      accessToken: 'token-viejo',
    });

    const sesionRenovada = await repository.renovarSesion();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(sesionRenovada.accessToken).toBe('nuevo-access-token');
    expect(sesionRenovada.usuario.nombre).toBe('Carmen');
  });

  it('solicitarInicioSesion realiza POST a /auth/login con identificación y contacto', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        solicitudId: 'sol-login-456',
        canal: 'CORREO',
        destino: 'a****@correo.com',
        mensaje: 'Código enviado a tu correo',
        expiraEn: '2026-01-01T00:10:00.000Z',
        puedeReenviarEn: '2026-01-01T00:01:00.000Z',
      }),
    } as Response);

    const resultado = await repository.solicitarInicioSesion({
      numeroIdentificacion: '41234567',
      contacto: 'ana@correo.com',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          numeroIdentificacion: '41234567',
          contacto: 'ana@correo.com',
        }),
      }),
    );
    expect(resultado.solicitudId).toBe('sol-login-456');
    expect(resultado.registroId).toBe('sol-login-456');
    expect(resultado.canal).toBe('CORREO');
  });

  it('verificarInicioSesion realiza POST a /auth/login/verificar y devuelve la sesión', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        usuario: { nombre: 'Carmen Rodríguez', rol: 'USUARIO_PUBLICO' },
        accessToken: 'access-jwt-123',
        accessTokenExpiraEn: '2026-01-01T01:00:00.000Z',
        refreshTokenExpiraEn: '2026-01-08T00:00:00.000Z',
      }),
    } as Response);

    const sesion = await repository.verificarInicioSesion({
      solicitudId: 'sol-login-456',
      codigo: '483920',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/login/verificar',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          solicitudId: 'sol-login-456',
          codigo: '483920',
        }),
      }),
    );
    expect(sesion.usuario.nombre).toBe('Carmen Rodríguez');
    expect(sesion.accessToken).toBe('access-jwt-123');
  });
});
