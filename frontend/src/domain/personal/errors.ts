export class PersonalError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    /** `codigo` estable del backend (C-00), p. ej. `CODIGO_EXPIRADO`. */
    public readonly codigo?: string,
  ) {
    super(message);
    this.name = 'PersonalError';
  }
}

/** La sesión venció y no se pudo renovar: hay que volver a iniciar sesión. */
export class SesionPersonalExpiradaError extends PersonalError {
  constructor(message = 'Tu sesión terminó. Vuelve a iniciar sesión.') {
    super(message, 401, 'SESION_INVALIDA');
    this.name = 'SesionPersonalExpiradaError';
  }
}

export class CredencialesIncorrectasError extends PersonalError {
  constructor(message = 'Credenciales incorrectas') {
    super(message, 401);
    this.name = 'CredencialesIncorrectasError';
  }
}

export class CodigoPersonalInvalidoError extends PersonalError {
  constructor(message = 'El código ingresado es incorrecto') {
    super(message, 400);
    this.name = 'CodigoPersonalInvalidoError';
  }
}

export class CodigoPersonalExpiradoError extends PersonalError {
  constructor(
    message = 'El código ha expirado. Por favor, solicita uno nuevo.',
  ) {
    super(message, 410);
    this.name = 'CodigoPersonalExpiradoError';
  }
}

export class CorreoEnUsoError extends PersonalError {
  constructor(message = 'Este correo electrónico ya está registrado.') {
    super(message, 409);
    this.name = 'CorreoEnUsoError';
  }
}

export class AccesoDenegadoPersonalError extends PersonalError {
  constructor(
    message = 'No tienes permisos de administrador para realizar esta acción.',
  ) {
    super(message, 403);
    this.name = 'AccesoDenegadoPersonalError';
  }
}

export class PasswordDebilError extends PersonalError {
  constructor(
    message = 'La contraseña debe tener al menos 8 caracteres, incluyendo letras y números.',
  ) {
    super(message, 400);
    this.name = 'PasswordDebilError';
  }
}

export class ServicioNoDisponiblePersonalError extends PersonalError {
  constructor(
    message = 'No pudimos comunicarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    statusCode?: number,
  ) {
    super(message, statusCode);
    this.name = 'ServicioNoDisponiblePersonalError';
  }
}
