import { createId } from '@cv-craft/shared';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getProfileRecord, saveProfile } from './accounts.js';
import { HttpError } from './http/errors.js';

const PHOTO_ID = /^ph_[A-Za-z0-9]+$/;
const SAFE_SEGMENT = /^[A-Za-z0-9_]+$/;

/** Directory for processed JPEGs. Override with UPLOAD_DIR. */
export function defaultUploadDir() {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  return fileURLToPath(new URL('../../../../data/uploads', import.meta.url));
}

/**
 * Decodes an upload, drops metadata, and stores one square JPEG for the account.
 * Replaces any previous photo.
 */
export async function storePhoto(db, userId, { revision, bytes, dir }) {
  const jpeg = await processPhoto(bytes);
  const record = getProfileRecord(db, userId);
  if (!record) throw new HttpError(404, 'NOT_FOUND', 'Profile not found.');

  const id = createId('ph');
  const previous = record.profile.basics.photo;
  writePhoto(dir, userId, id, jpeg);
  try {
    db.prepare('INSERT INTO photos (id, user_id, created_at) VALUES (?, ?, ?)').run(id, userId, new Date().toISOString());
    const saved = saveProfile(db, userId, {
      revision,
      profile: {
        ...record.profile,
        basics: { ...record.profile.basics, photo: { id, width: 600, height: 600 } },
      },
    });
    if (previous?.id) deletePhoto(db, userId, previous.id, dir);
    return { photo: saved.profile.basics.photo, revision: saved.revision };
  } catch (error) {
    deletePhoto(db, userId, id, dir);
    throw error;
  }
}

export function removePhoto(db, userId, { revision, dir }) {
  const record = getProfileRecord(db, userId);
  if (!record) throw new HttpError(404, 'NOT_FOUND', 'Profile not found.');
  const previous = record.profile.basics.photo;
  const saved = saveProfile(db, userId, {
    revision,
    profile: { ...record.profile, basics: { ...record.profile.basics, photo: null } },
  });
  if (previous?.id) deletePhoto(db, userId, previous.id, dir);
  return { photo: null, revision: saved.revision };
}

/** Drops every photo for the account. Used after an import, which never includes the file. */
export function clearPhotos(db, userId, dir) {
  const rows = db.prepare('SELECT id FROM photos WHERE user_id = ?').all(userId);
  db.prepare('DELETE FROM photos WHERE user_id = ?').run(userId);
  for (const row of rows) {
    rmSync(photoPath(dir, userId, row.id), { force: true });
  }
}

/** Owner-only bytes, or null when the id is missing or belongs to someone else. */
export function readPhoto(db, userId, photoId, dir) {
  if (!PHOTO_ID.test(photoId)) return null;
  const row = db.prepare('SELECT id FROM photos WHERE id = ? AND user_id = ?').get(photoId, userId);
  if (!row) return null;
  try {
    return readFileSync(photoPath(dir, userId, photoId));
  } catch {
    return null;
  }
}

/**
 * Adds a data URL so the PDF renderer can embed the picture without a network request.
 * The stored profile is unchanged.
 */
export function attachPhotoSrc(db, userId, profile, dir) {
  const photo = profile?.basics?.photo;
  if (!photo?.id) return profile;
  const bytes = readPhoto(db, userId, photo.id, dir);
  if (!bytes) return profile;
  return {
    ...profile,
    basics: {
      ...profile.basics,
      photo: { ...photo, src: `data:image/jpeg;base64,${bytes.toString('base64')}` },
    },
  };
}

async function processPhoto(bytes) {
  if (!bytes?.length) throw new HttpError(422, 'VALIDATION_FAILED', 'Choose an image file.');
  let meta;
  try {
    meta = await sharp(bytes, { failOn: 'error', limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new HttpError(422, 'VALIDATION_FAILED', 'That image could not be read.');
  }
  if (!['jpeg', 'png', 'webp'].includes(meta.format)) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Use a JPEG, PNG, or WebP image.');
  }
  try {
    return await sharp(bytes, { failOn: 'error', limitInputPixels: 40_000_000 })
      .rotate()
      .resize(600, 600, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new HttpError(422, 'VALIDATION_FAILED', 'That image could not be read.');
  }
}

function writePhoto(dir, userId, id, bytes) {
  const path = photoPath(dir, userId, id);
  mkdirSync(join(dir, userId), { recursive: true });
  writeFileSync(path, bytes);
}

function deletePhoto(db, userId, id, dir) {
  if (!PHOTO_ID.test(id)) return;
  db.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?').run(id, userId);
  rmSync(photoPath(dir, userId, id), { force: true });
}

function photoPath(dir, userId, id) {
  if (!SAFE_SEGMENT.test(userId) || !PHOTO_ID.test(id)) {
    throw new HttpError(404, 'NOT_FOUND', 'Photo not found.');
  }
  return join(dir, userId, `${id}.jpg`);
}
