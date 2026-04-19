/**
 * Custom error classes — mirrors the pattern in Presto.
 * Thrown from route handlers and caught by `catchErrors`.
 */

/** 422 Unprocessable Entity — bad input / validation failure */
class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
  }
}

/** 401 / 403 — authentication or authorization failure */
class AccessError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AccessError';
    this.status = status;
  }
}

/** 404 Not Found */
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** 409 Conflict — duplicate resource */
class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

module.exports = { InputError, AccessError, NotFoundError, ConflictError };
