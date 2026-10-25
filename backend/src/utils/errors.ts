export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request data', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ExpiredError extends AppError {
  constructor(message = 'This share has expired.', code = 'SHARE_EXPIRED') {
    super(message, 410, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized action or invalid capability token', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden action', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload exceeds maximum allowed size', code = 'PAYLOAD_TOO_LARGE') {
    super(message, 413, code);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported file format or MIME type', code = 'UNSUPPORTED_MEDIA_TYPE') {
    super(message, 415, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', code = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
  }
}
