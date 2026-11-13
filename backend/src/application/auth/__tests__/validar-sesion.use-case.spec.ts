import { SesionInvalidaError } from '../../../domain/auth/errores.js';
import { ValidarSesionUseCase } from '../validar-sesion.use-case.js';
import {
  ContenidoAccessToken,
  VerificadorAccessToken,
} from '../verificador-access-token.port.js';
import { RelojFijo, SesionRepositoryEnMemoria } from './fakes.js';

class VerificadorFalso implements VerificadorAccessToken {
  tokens = new Map<string, ContenidoAccessToken>();
  verificar(token: string): Promise<ContenidoAccessToken | null> {
    return Promise.resolve(this.tokens.get(token) ?? null);
  }
}

describe('ValidarSesion', () => {
  let verificador: VerificadorFalso;
  let sesiones: SesionRepositoryEnMemoria;
  let validar: ValidarSesionUseCase;

  beforeEach(() => {
    verificador = new VerificadorFalso();
    sesiones = new SesionRepositoryEnMemoria();
    validar = new ValidarSesionUseCase(
      verificador,
      sesiones,
      new RelojFijo(new Date('2026-11-12T15:00:00Z')),
    );
  });

  it('devuelve el usuario con el rol que tiene hoy en la base de datos', async () => {
    verificador.tokens.set('token', { sid: 's1', rol: 'PERSONAL' });
    sesiones.sesiones.push({
      sesionId: 's1',
      usuarioId: 'p1',
      rol: 'ADMINISTRADOR',
      revocada: false,
    });
    await expect(validar.ejecutar('token')).resolves.toEqual({
      id: 'p1',
      rol: 'ADMINISTRADOR',
      sesionId: 's1',
    });
  });

  it('rechaza un token con firma inválida o vencido', async () => {
    await expect(validar.ejecutar('falso')).rejects.toThrow(
      SesionInvalidaError,
    );
  });

  it('rechaza un token cuya sesión se cerró', async () => {
    verificador.tokens.set('token', { sid: 's1', rol: 'PERSONAL' });
    sesiones.sesiones.push({
      sesionId: 's1',
      usuarioId: 'p1',
      rol: 'PERSONAL',
      revocada: true,
    });
    await expect(validar.ejecutar('token')).rejects.toThrow(
      SesionInvalidaError,
    );
  });
});
