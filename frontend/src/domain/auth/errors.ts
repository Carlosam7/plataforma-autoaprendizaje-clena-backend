export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly campo?: string,
    /** `codigo` estable del backend (C-00), p. ej. `CODIGO_EXPIRADO`. */
    public readonly codigo?: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthValidationError extends AuthError {
  constructor(message: string, campo?: string, codigo?: string) {
    super(message, 400, campo, codigo);
    this.name = 'AuthValidationError';
  }
}

export class AuthConflictError extends AuthError {
  constructor(
    message = 'Los datos ingresados ya se encuentran registrados.',
    codigo?: string,
    campo?: string,
  ) {
    super(message, 409, campo, codigo);
    this.name = 'AuthConflictError';
  }
}

export class AuthExpiredError extends AuthError {
  constructor(
    message = 'El código ha vencido. Por favor solicita uno nuevo.',
    codigo?: string,
  ) {
    super(message, 410, undefined, codigo);
    this.name = 'AuthExpiredError';
  }
}

export class AuthRateLimitError extends AuthError {
  constructor(
    message = 'Has realizado demasiados intentos. Por favor espera un momento.',
    codigo?: string,
  ) {
    super(message, 429, undefined, codigo);
    this.name = 'AuthRateLimitError';
  }
}

/** La sesión venció y no se pudo renovar: hay que volver a iniciar sesión. */
export class AuthSessionExpiredError extends AuthError {
  constructor(message = 'Tu sesión terminó. Vuelve a iniciar sesión.') {
    super(message, 401, undefined, 'SESION_INVALIDA');
    this.name = 'AuthSessionExpiredError';
  }
}
