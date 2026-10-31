import { createHash, randomBytes } from 'node:crypto';

export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const SLIDE_WHEN_REMAINING_MS = 15 * 24 * 60 * 60 * 1000;

export function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

/** Only the hash is stored, so a copied database cannot be used as a session. */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionExpiry(from = Date.now()) {
  return new Date(from + SESSION_MS).toISOString();
}

export function shouldSlide(expiresAt, now = Date.now()) {
  return Date.parse(expiresAt) - now < SLIDE_WHEN_REMAINING_MS;
}

export function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export function sessionCookie(token, { secure }) {
  const parts = [`sid=${encodeURIComponent(token)}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${SESSION_MS / 1000}`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie({ secure }) {
  const parts = ['sid=', 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
