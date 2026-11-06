/**
 * Variables de entorno validadas al arrancar. Si falta una obligatoria o tiene un
 * formato inválido, la aplicación no inicia y el error dice cuál es.
 */
export interface VariablesEntorno {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
  CORS_ORIGINS: string[];
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN_SEGUNDOS: number;
  REFRESH_TOKEN_TTL_HORAS: number;
  AVISO_PRIVACIDAD_VERSION: string;
  CODIGO_VERIFICACION_TTL_MINUTOS: number;
  CODIGO_VERIFICACION_MAX_INTENTOS: number;
  CODIGO_VERIFICACION_ESPERA_REENVIO_SEGUNDOS: number;
  NOTIFICACIONES_PROVEEDOR: 'consola';
}

export function validarVariablesEntorno(
  env: Record<string, unknown>,
): VariablesEntorno {
  const errores: string[] = [];

  const texto = (nombre: string, porDefecto?: string): string => {
    const valor = env[nombre];
    if (typeof valor === 'string' && valor.trim() !== '') return valor.trim();
    if (porDefecto !== undefined) return porDefecto;
    errores.push(`${nombre} es obligatoria`);
    return '';
  };

  const entero = (nombre: string, porDefecto: number): number => {
    const crudo = env[nombre];
    if (crudo === undefined || crudo === '') return porDefecto;
    const valor = Number(crudo);
    if (!Number.isInteger(valor) || valor <= 0) {
      errores.push(`${nombre} debe ser un entero positivo`);
    }
    return valor;
  };

  const opcion = <T extends string>(
    nombre: string,
    opciones: readonly T[],
    porDefecto: T,
  ): T => {
    const valor = texto(nombre, porDefecto) as T;
    if (!opciones.includes(valor))
      errores.push(`${nombre} debe ser uno de: ${opciones.join(', ')}`);
    return valor;
  };

  const nodeEnv = opcion(
    'NODE_ENV',
    ['development', 'test', 'production'] as const,
    'development',
  );
  const jwtSecret = texto('JWT_ACCESS_SECRET');
  if (jwtSecret && jwtSecret.length < 32) {
    errores.push('JWT_ACCESS_SECRET debe tener al menos 32 caracteres');
  }

  const variables: VariablesEntorno = {
    PORT: entero('PORT', 3000),
    NODE_ENV: nodeEnv,
    CORS_ORIGINS: texto('CORS_ORIGINS', 'http://localhost:5173')
      .split(',')
      .map((origen) => origen.trim())
      .filter(Boolean),
    DATABASE_URL: texto('DATABASE_URL'),
    JWT_ACCESS_SECRET: jwtSecret,
    JWT_ACCESS_EXPIRES_IN_SEGUNDOS: entero(
      'JWT_ACCESS_EXPIRES_IN_SEGUNDOS',
      900,
    ),
    REFRESH_TOKEN_TTL_HORAS: entero('REFRESH_TOKEN_TTL_HORAS', 12),
    AVISO_PRIVACIDAD_VERSION: texto('AVISO_PRIVACIDAD_VERSION'),
    CODIGO_VERIFICACION_TTL_MINUTOS: entero(
      'CODIGO_VERIFICACION_TTL_MINUTOS',
      10,
    ),
    CODIGO_VERIFICACION_MAX_INTENTOS: entero(
      'CODIGO_VERIFICACION_MAX_INTENTOS',
      5,
    ),
    CODIGO_VERIFICACION_ESPERA_REENVIO_SEGUNDOS: entero(
      'CODIGO_VERIFICACION_ESPERA_REENVIO_SEGUNDOS',
      60,
    ),
    NOTIFICACIONES_PROVEEDOR: opcion(
      'NOTIFICACIONES_PROVEEDOR',
      ['consola'] as const,
      'consola',
    ),
  };

  if (
    variables.NODE_ENV === 'production' &&
    variables.NOTIFICACIONES_PROVEEDOR === 'consola'
  ) {
    errores.push(
      'NOTIFICACIONES_PROVEEDOR=consola escribe los códigos en los logs y no se permite en producción',
    );
  }

  if (errores.length > 0) {
    throw new Error(`Configuración inválida:\n- ${errores.join('\n- ')}`);
  }
  return variables;
}
