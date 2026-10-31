import { HttpError } from './errors.js';

export function requireJson(req, _res, next) {
  if (!req.is('application/json')) {
    return next(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.'));
  }
  next();
}
