export class PersonalError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'PersonalError';
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
