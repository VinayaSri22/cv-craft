import { findSession, slideSession } from '../accounts.js';
import { HttpError } from '../http/errors.js';
import { clearSessionCookie, hashToken, readCookie, sessionCookie, shouldSlide } from './sessions.js';

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ secureCookies: boolean }} options
 */
export function createAuth(db, { secureCookies }) {
  return {
    /** Sets req.user from the session cookie, or 401. */
    requireAuth(req, res, next) {
      const token = readCookie(req.get('cookie'), 'sid');
      const session = token ? findSession(db, hashToken(token)) : null;
      if (!session) return next(new HttpError(401, 'UNAUTHENTICATED', 'Sign in required.'));
      if (shouldSlide(session.expires_at)) {
        slideSession(db, session.session_id);
        res.setHeader('Set-Cookie', sessionCookie(token, { secure: secureCookies }));
      }
      req.user = {
        id: session.id,
        email: session.email,
        displayName: session.display_name,
        mustChangePassword: session.must_change_password === 1,
      };
      req.sessionHash = session.session_id;
      next();
    },

    startSession(res, token) {
      res.setHeader('Set-Cookie', sessionCookie(token, { secure: secureCookies }));
    },

    endSession(res) {
      res.setHeader('Set-Cookie', clearSessionCookie({ secure: secureCookies }));
    },
  };
}
