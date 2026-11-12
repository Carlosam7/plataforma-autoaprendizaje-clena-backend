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
  CODIGO_VERIFICACION_TTL_MINUTOS: number;
  CODIGO_VERIFICACION_MAX_INTENTOS: number;
  CODIGO_VERIFICACION_ESPERA_REENVIO_SEGUNDOS: number;
  AUTH_LIMITE_PETICIONES: number;
  AUTH_LIMITE_VENTANA_SEGUNDOS: number;
  NOTIFICACIONES_CORREO: 'consola' | 'smtp';
  NOTIFICACIONES_SMS: 'consola' | 'twilio' | 'textbee';
  SMTP_HOST: string;
  SMTP_PUERTO: number;
  SMTP_USUARIO: string;
  SMTP_CLAVE: string;
  CORREO_REMITENTE: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_NUMERO_ORIGEN: string;
  TEXTBEE_API_KEY: string;
  TEXTBEE_DEVICE_ID: string;
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

  const notificacionesCorreo = opcion(
    'NOTIFICACIONES_CORREO',
    ['consola', 'smtp'] as const,
    'consola',
  );

  const notificacionesSms = opcion(
    'NOTIFICACIONES_SMS',
    ['consola', 'twilio', 'textbee'] as const,
    'consola',
  );

  const usaSmtp = notificacionesCorreo === 'smtp';

  const usaTwilio = notificacionesSms === 'twilio';

  const usaTextbee = notificacionesSms === 'textbee';

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
    // HU-02: peticiones por IP a login, verificación, refresh y logout dentro de la ventana.
    // La sala comparte IP, así que el límite no puede ser muy bajo.
    AUTH_LIMITE_PETICIONES: entero('AUTH_LIMITE_PETICIONES', 30),
    AUTH_LIMITE_VENTANA_SEGUNDOS: entero('AUTH_LIMITE_VENTANA_SEGUNDOS', 60),
    NOTIFICACIONES_CORREO: notificacionesCorreo,
    NOTIFICACIONES_SMS: notificacionesSms,
    // Solo son obligatorias si el correo se envía de verdad.
    SMTP_HOST: texto('SMTP_HOST', usaSmtp ? undefined : ''),
    SMTP_PUERTO: entero('SMTP_PUERTO', 587),
    SMTP_USUARIO: texto('SMTP_USUARIO', usaSmtp ? undefined : ''),
    SMTP_CLAVE: texto('SMTP_CLAVE', usaSmtp ? undefined : ''),
    CORREO_REMITENTE: texto('CORREO_REMITENTE', usaSmtp ? undefined : ''),
    // Solo son obligatorias si el SMS se envía de verdad.
    TWILIO_ACCOUNT_SID: texto('TWILIO_ACCOUNT_SID', usaTwilio ? undefined : ''),
    TWILIO_AUTH_TOKEN: texto('TWILIO_AUTH_TOKEN', usaTwilio ? undefined : ''),
    TWILIO_NUMERO_ORIGEN: texto(
      'TWILIO_NUMERO_ORIGEN',
      usaTwilio ? undefined : '',
    ),
    TEXTBEE_API_KEY: texto('TEXTBEE_API_KEY', usaTextbee ? undefined : ''),
    TEXTBEE_DEVICE_ID: texto('TEXTBEE_DEVICE_ID', usaTextbee ? undefined : ''),
  };

  if (variables.NODE_ENV === 'production') {
    for (const canal of [
      'NOTIFICACIONES_CORREO',
      'NOTIFICACIONES_SMS',
    ] as const) {
      if (variables[canal] === 'consola') {
        errores.push(
          `${canal}=consola escribe los códigos en los logs y no se permite en producción`,
        );
      }
    }
  }

  if (errores.length > 0) {
    throw new Error(`Configuración inválida:\n- ${errores.join('\n- ')}`);
  }
  return variables;
}
