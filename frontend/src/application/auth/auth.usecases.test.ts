import { describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from './ports';
import { ObtenerAvisoPrivacidad } from './ObtenerAvisoPrivacidad';
import { SolicitarRegistro } from './SolicitarRegistro';
import { VerificarCodigoRegistro } from './VerificarCodigoRegistro';
import { ReenviarCodigoRegistro } from './ReenviarCodigoRegistro';
import { AuthValidationError } from '@/domain/auth/errors';

function crearMockRepository(): AuthRepository {
  return {
    obtenerAvisoPrivacidad: vi.fn().mockResolvedValue({
      version: '1.0',
      contenido: 'Texto del aviso...',
      vigenteDesde: new Date('2026-01-01'),
    }),
    solicitarRegistro: vi.fn().mockResolvedValue({
      registroId: 'reg-123',
      canal: 'CORREO',
      destino: 'a****@correo.com',
      mensaje: 'Código enviado a a****@correo.com',
      expiraEn: new Date(Date.now() + 600000),
      puedeReenviarEn: new Date(Date.now() + 60000),
    }),
    verificarRegistro: vi.fn().mockResolvedValue({
      usuario: { nombre: 'Carmen Rodríguez', rol: 'USUARIO_PUBLICO' },
      accessToken: 'jwt-token-test',
    }),
    reenviarCodigo: vi.fn().mockResolvedValue({
      registroId: 'reg-123',
      canal: 'CORREO',
      destino: 'a****@correo.com',
      mensaje: 'Código reenviado a a****@correo.com',
      expiraEn: new Date(Date.now() + 600000),
      puedeReenviarEn: new Date(Date.now() + 60000),
    }),
    guardarSesion: vi.fn().mockResolvedValue(undefined),
    obtenerSesion: vi.fn().mockResolvedValue(null),
    cerrarSesion: vi.fn().mockResolvedValue(undefined),
  };
}

describe('Auth Use Cases', () => {
  it('ObtenerAvisoPrivacidad devuelve el aviso vigente del repositorio', async () => {
    const repo = crearMockRepository();
    const useCase = new ObtenerAvisoPrivacidad(repo);
    const resultado = await useCase.ejecutar();
    expect(resultado.version).toBe('1.0');
    expect(repo.obtenerAvisoPrivacidad).toHaveBeenCalledOnce();
  });

  describe('SolicitarRegistro', () => {
    it('valida datos obligatorios y llama al repositorio con formulario simplificado de Figma', async () => {
      const repo = crearMockRepository();
      const useCase = new SolicitarRegistro(repo);
      const resultado = await useCase.ejecutar({
        nombre: 'Carmen Rodríguez',
        correo: 'carmen@correo.com',
      });

      expect(resultado.registroId).toBe('reg-123');
      expect(repo.solicitarRegistro).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Carmen Rodríguez',
          correo: 'carmen@correo.com',
          aceptaAvisoPrivacidad: true,
        }),
      );
    });

    it('rechaza si el nombre es demasiado corto', async () => {
      const repo = crearMockRepository();
      const useCase = new SolicitarRegistro(repo);
      await expect(
        useCase.ejecutar({
          nombre: 'C',
          numeroIdentificacion: '12345678',
          fechaNacimiento: '1955-08-21',
          correo: 'carmen@correo.com',
          aceptaAvisoPrivacidad: true,
        }),
      ).rejects.toThrow(AuthValidationError);
    });

    it('rechaza si no se acepta el aviso de privacidad', async () => {
      const repo = crearMockRepository();
      const useCase = new SolicitarRegistro(repo);
      await expect(
        useCase.ejecutar({
          nombre: 'Carmen Rodríguez',
          numeroIdentificacion: '12345678',
          fechaNacimiento: '1955-08-21',
          correo: 'carmen@correo.com',
          aceptaAvisoPrivacidad: false,
        }),
      ).rejects.toThrow(AuthValidationError);
    });

    it('acepta número de celular válido', async () => {
      const repo = crearMockRepository();
      const useCase = new SolicitarRegistro(repo);
      await useCase.ejecutar({
        nombre: 'Carmen Rodríguez',
        numeroIdentificacion: '12345678',
        fechaNacimiento: '1955-08-21',
        telefono: '300 123 4567',
        aceptaAvisoPrivacidad: true,
      });
      expect(repo.solicitarRegistro).toHaveBeenCalled();
    });
  });

  describe('VerificarCodigoRegistro', () => {
    it('valida código de 6 dígitos y guarda la sesión', async () => {
      const repo = crearMockRepository();
      const useCase = new VerificarCodigoRegistro(repo);
      const sesion = await useCase.ejecutar({
        registroId: 'reg-123',
        codigo: '483920',
      });
      expect(sesion.accessToken).toBe('jwt-token-test');
      expect(repo.guardarSesion).toHaveBeenCalledWith(sesion);
    });

    it('rechaza código con formato inválido', async () => {
      const repo = crearMockRepository();
      const useCase = new VerificarCodigoRegistro(repo);
      await expect(
        useCase.ejecutar({
          registroId: 'reg-123',
          codigo: '1234',
        }),
      ).rejects.toThrow(AuthValidationError);
    });
  });

  describe('ReenviarCodigoRegistro', () => {
    it('reenvía el código si el registroId es válido', async () => {
      const repo = crearMockRepository();
      const useCase = new ReenviarCodigoRegistro(repo);
      const resultado = await useCase.ejecutar('reg-123');
      expect(resultado.registroId).toBe('reg-123');
      expect(repo.reenviarCodigo).toHaveBeenCalledWith('reg-123');
    });
  });
});
