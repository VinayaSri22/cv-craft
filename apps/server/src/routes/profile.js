import { Router } from 'express';
import { exportDocument, getProfileRecord, importDocument, saveProfile } from '../accounts.js';
import { readSingleFile } from '../http/multipart.js';
import { HttpError } from '../http/errors.js';
import { requireJson } from '../http/requireJson.js';
import { clearPhotos, readPhoto, removePhoto, storePhoto } from '../photos.js';

export function profileRoutes(db, { uploadDir }) {
  const router = Router();

  router.get('/profile', (req, res) => {
    const record = getProfileRecord(db, req.user.id);
    if (!record) throw new HttpError(404, 'NOT_FOUND', 'Profile not found.');
    res.json(record);
  });

  router.put('/profile', requireJson, (req, res) => {
    res.json(saveProfile(db, req.user.id, { revision: req.body?.revision, profile: req.body?.profile }));
  });

  router.get('/profile/export', (req, res) => {
    const file = exportDocument(db, req.user.id);
    const filename = exportFilename(file.profile);
    res
      .set({
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      })
      .json(file);
  });

  router.post('/profile/import', requireJson, (req, res) => {
    const record = importDocument(db, req.user.id, req.body);
    clearPhotos(db, req.user.id, uploadDir);
    res.json(record);
  });

  router.post('/profile/photo', async (req, res) => {
    const { bytes, fields } = await readSingleFile(req);
    const revision = Number(fields.revision);
    if (!Number.isInteger(revision)) {
      throw new HttpError(422, 'VALIDATION_FAILED', 'Profile revision is missing.');
    }
    res.json(await storePhoto(db, req.user.id, { revision, bytes, dir: uploadDir }));
  });

  router.delete('/profile/photo', requireJson, (req, res) => {
    res.json(removePhoto(db, req.user.id, { revision: req.body?.revision, dir: uploadDir }));
  });

  router.get('/photos/:id', (req, res) => {
    const bytes = readPhoto(db, req.user.id, req.params.id, uploadDir);
    if (!bytes) throw new HttpError(404, 'NOT_FOUND', 'Photo not found.');
    res
      .status(200)
      .set({
        'Content-Type': 'image/jpeg',
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'private, max-age=3600',
      })
      .end(bytes);
  });

  return router;
}

function exportFilename(profile) {
  const name = (profile.basics?.fullName ?? '')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${name || 'cv-craft'}.json`;
}
