export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly campo?: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthValidationError extends AuthError {
  constructor(message: string, campo?: string) {
    super(message, 400, campo);
    this.name = 'AuthValidationError';
  }
}

export class AuthConflictError extends AuthError {
  constructor(message = 'Los datos ingresados ya se encuentran registrados.') {
    super(message, 409);
    this.name = 'AuthConflictError';
  }
}

export class AuthExpiredError extends AuthError {
  constructor(message = 'El código ha vencido. Por favor solicita uno nuevo.') {
    super(message, 410);
    this.name = 'AuthExpiredError';
  }
}

export class AuthRateLimitError extends AuthError {
  constructor(
    message = 'Has realizado demasiados intentos. Por favor espera un momento.',
  ) {
    super(message, 429);
    this.name = 'AuthRateLimitError';
  }
}
