import { HttpError } from './errors.js';

export const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

/** Browsers send Origin on mutating requests. Requests without one (tests, curl) are allowed. */
export function requireAllowedOrigin(allowedOrigins) {
  const allowed = new Set(allowedOrigins);
  return (req, _res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin || allowed.has(origin)) return next();
    next(new HttpError(403, 'BAD_ORIGIN', 'Request origin is not allowed.'));
  };
}
