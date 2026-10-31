import { Router } from 'express';
import { getProfileRecord, saveProfile } from '../accounts.js';
import { HttpError } from '../http/errors.js';
import { requireJson } from '../http/requireJson.js';

export function profileRoutes(db) {
  const router = Router();

  router.get('/profile', (req, res) => {
    const record = getProfileRecord(db, req.user.id);
    if (!record) throw new HttpError(404, 'NOT_FOUND', 'Profile not found.');
    res.json(record);
  });

  router.put('/profile', requireJson, (req, res) => {
    res.json(saveProfile(db, req.user.id, { revision: req.body?.revision, profile: req.body?.profile }));
  });

  return router;
}
