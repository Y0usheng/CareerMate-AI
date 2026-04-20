/**
 * Route helpers — mirrors the catchErrors / authed pattern from Presto.
 */
const { validationResult } = require('express-validator');
const { InputError, AccessError, NotFoundError, ConflictError } = require('./errors');

/**
 * Wraps an async route handler and maps custom errors to HTTP responses.
 * Unknown errors are forwarded to Express's global error handler via next().
 *
 * Usage:
 *   router.post('/path', [...validators], catchErrors(async (req, res) => {
 *     validate(req);
 *     // throw InputError / AccessError / NotFoundError / ConflictError as needed
 *   }));
 */
const catchErrors = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof InputError) {
      return res.status(422).json({ detail: err.message });
    }
    if (err instanceof AccessError) {
      return res.status(err.status || 401).json({ detail: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ detail: err.message });
    }
    if (err instanceof ConflictError) {
      return res.status(409).json({ detail: err.message });
    }
    next(err);
  }
};

/**
 * Asserts that express-validator found no errors in the request.
 * Throws InputError (→ 422) with the first error message if validation failed.
 */
const validate = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new InputError(errors.array()[0].msg);
  }
};

module.exports = { catchErrors, validate };
