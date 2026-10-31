import { Router } from 'express';
import { changePassword, loginAccount, logoutAccount, registerAccount } from '../accounts.js';
import { HttpError } from '../http/errors.js';
import { requireJson } from '../http/requireJson.js';

/**
 * @param {{ db: import('node:sqlite').DatabaseSync, auth: ReturnType<import('../auth/middleware.js').createAuth>, rateLimit?: (key: string) => boolean }} deps
 */
export function authRoutes({ db, auth, rateLimit }) {
  const router = Router();

  const limit = (req, email) => {
    if (!rateLimit) return;
    const key = `${req.ip}:${String(email ?? '').toLowerCase()}`;
    if (!rateLimit(key)) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.');
    }
  };

  router.post('/register', requireJson, async (req, res) => {
    limit(req, req.body?.email);
    const { token, user } = await registerAccount(db, req.body ?? {});
    auth.startSession(res, token);
    res.status(201).json({ user });
  });

  router.post('/login', requireJson, async (req, res) => {
    limit(req, req.body?.email);
    const { token, user } = await loginAccount(db, req.body ?? {});
    auth.startSession(res, token);
    res.json({ user });
  });

  router.post('/logout', auth.requireAuth, (req, res) => {
    logoutAccount(db, req.sessionHash);
    auth.endSession(res);
    res.json({ ok: true });
  });

  router.get('/me', auth.requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  router.post('/change-password', requireJson, auth.requireAuth, async (req, res) => {
    const user = await changePassword(db, req.user.id, req.sessionHash, req.body ?? {});
    res.json({ user });
  });

  return router;
}
