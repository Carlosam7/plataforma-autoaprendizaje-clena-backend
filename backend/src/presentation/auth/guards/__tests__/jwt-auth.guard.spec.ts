import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import {
  UsuarioAutenticado,
  ValidarSesionUseCase,
} from '../../../../application/auth/validar-sesion.use-case.js';
import { SesionInvalidaError } from '../../../../domain/auth/errores.js';
import { Publico, SesionOpcional } from '../../../shared/publico.decorator.js';
import { PeticionAutenticada } from '../../../shared/usuario-actual.decorator.js';
import { JwtAuthGuard } from '../jwt-auth.guard.js';

const USUARIO: UsuarioAutenticado = {
  id: '41234567',
  rol: 'USUARIO_PUBLICO',
  sesionId: 's1',
};

/** Cuenta cuántas veces se valida un token; acepta solo «bueno». */
class ValidarSesionFalso {
  llamadas = 0;
  ejecutar(token: string): Promise<UsuarioAutenticado> {
    this.llamadas += 1;
    return token === 'bueno'
      ? Promise.resolve(USUARIO)
      : Promise.reject(new SesionInvalidaError());
  }
}

class Rutas {
  @Publico()
  publica(): void {}

  @SesionOpcional()
  conSesionOpcional(): void {}

  protegida(): void {}
}

function contexto(ruta: keyof Rutas, peticion: PeticionAutenticada) {
  return {
    getHandler: () => Rutas.prototype[ruta],
    getClass: () => Rutas,
    switchToHttp: () => ({ getRequest: () => peticion }),
  } as unknown as ExecutionContext;
}

function preparar() {
  const validar = new ValidarSesionFalso();
  const guard = new JwtAuthGuard(
    new Reflector(),
    validar as unknown as ValidarSesionUseCase,
  );
  const pasar = async (ruta: keyof Rutas, token?: string) => {
    const peticion = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    } as PeticionAutenticada;
    await guard.canActivate(contexto(ruta, peticion));
    return peticion.usuario ?? null;
  };
  return { validar, pasar };
}

describe('JwtAuthGuard', () => {
  it('una ruta @Publico() ignora el token: no lo valida ni identifica al usuario', async () => {
    const { validar, pasar } = preparar();
    expect(await pasar('publica', 'bueno')).toBeNull();
    expect(validar.llamadas).toBe(0);
  });

  describe('@SesionOpcional()', () => {
    it('con token válido identifica al usuario', async () => {
      const { pasar } = preparar();
      expect(await pasar('conSesionOpcional', 'bueno')).toEqual(USUARIO);
    });

    it('con token inválido sigue como anónimo, sin 401', async () => {
      const { pasar } = preparar();
      expect(await pasar('conSesionOpcional', 'malo')).toBeNull();
    });

    it('sin token sigue como anónimo', async () => {
      const { validar, pasar } = preparar();
      expect(await pasar('conSesionOpcional')).toBeNull();
      expect(validar.llamadas).toBe(0);
    });
  });

  it('una ruta protegida sin token responde 401', async () => {
    const { pasar } = preparar();
    await expect(pasar('protegida')).rejects.toThrow(UnauthorizedException);
  });
});
