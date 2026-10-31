import {
  createEmptyProfile,
  createId,
  createResumeSettings,
  parseProfile,
  parseResumeSettings,
} from '@cv-craft/shared';
import { DEFAULT_TEMPLATE_ID, defaultSectionOrder, getTemplate } from '@cv-craft/templates/catalog';
import { randomBytes } from 'node:crypto';
import { hashPassword, validPassword, verifyPassword } from './auth/passwords.js';
import { hashToken, newSessionToken, sessionExpiry } from './auth/sessions.js';
import { withTransaction } from './db/database.js';
import { HttpError } from './http/errors.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nowIso() {
  return new Date().toISOString();
}

export function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    mustChangePassword: row.must_change_password === 1,
  };
}

export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return null;
  return email;
}

function cleanDisplayName(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Display name must be 100 characters or fewer.');
  }
  return trimmed;
}

function cleanResumeName(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) return null;
  return trimmed;
}

export function findUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

/**
 * Creates the user, an empty profile, a first resume, and a session.
 * @returns {{ token: string, user: ReturnType<typeof publicUser> }}
 */
export async function registerAccount(db, input) {
  const email = normalizeEmail(input.email);
  if (!email) throw new HttpError(422, 'VALIDATION_FAILED', 'Enter a valid email address.');
  if (!validPassword(input.password)) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Password must be 8 to 128 characters.');
  }
  const displayName = cleanDisplayName(input.displayName);
  const passwordHash = await hashPassword(input.password);
  const now = nowIso();

  try {
    return withTransaction(db, () => {
      const userId = createId('usr');
      db.prepare(
        `INSERT INTO users (id, email, password_hash, display_name, must_change_password, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
      ).run(userId, email, passwordHash, displayName, now, now);

      const profile = createEmptyProfile();
      const profileId = createId('prf');
      db.prepare(
        `INSERT INTO profiles (id, user_id, schema_version, data, revision, updated_at)
         VALUES (?, ?, ?, ?, 1, ?)`,
      ).run(profileId, userId, profile.schemaVersion, JSON.stringify(profile), now);

      insertResume(db, {
        userId,
        profileId,
        name: 'My resume',
        settings: initialSettings(profile),
        now,
      });

      const token = newSessionToken();
      insertSession(db, token, userId, now);
      return { token, user: publicUser(findUserById(db, userId)) };
    });
  } catch (error) {
    if (findUserByEmail(db, email)) {
      throw new HttpError(409, 'EMAIL_TAKEN', 'An account with that email already exists.');
    }
    throw error;
  }
}

/** @returns {{ token: string, user: ReturnType<typeof publicUser> }} */
export async function loginAccount(db, input) {
  const email = normalizeEmail(input.email);
  const user = email ? findUserByEmail(db, email) : undefined;
  const ok = await verifyPassword(user?.password_hash, String(input.password ?? ''));
  if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

  const token = newSessionToken();
  insertSession(db, token, user.id, nowIso());
  return { token, user: publicUser(user) };
}

export function logoutAccount(db, sessionHash) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionHash);
}

export async function changePassword(db, userId, sessionHash, { currentPassword, newPassword }) {
  if (!validPassword(newPassword)) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Password must be 8 to 128 characters.');
  }
  const user = findUserById(db, userId);
  const ok = await verifyPassword(user?.password_hash, String(currentPassword ?? ''));
  if (!ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.');

  const now = nowIso();
  db.prepare(
    `UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?`,
  ).run(await hashPassword(newPassword), now, userId);
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(userId, sessionHash);
  return publicUser(findUserById(db, userId));
}

/**
 * Operator password reset. Signs the user out everywhere and requires a new
 * password at the next login. Returns the temporary password, or null when
 * the email has no account.
 */
export async function resetPassword(db, emailInput) {
  const email = normalizeEmail(emailInput);
  const user = email ? findUserByEmail(db, email) : undefined;
  if (!user) return null;
  const temporary = randomTemporaryPassword();
  const now = nowIso();
  db.prepare(
    `UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = ? WHERE id = ?`,
  ).run(await hashPassword(temporary), now, user.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  return temporary;
}

export function getProfileRecord(db, userId) {
  const row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  if (!row) return null;
  const parsed = parseProfile(JSON.parse(row.data));
  if (!parsed.ok) throw new Error('Stored profile failed validation.');
  return {
    id: row.id,
    revision: row.revision,
    updatedAt: row.updated_at,
    profile: parsed.data,
  };
}

export function saveProfile(db, userId, { revision, profile }) {
  if (!Number.isInteger(revision)) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Profile revision is missing.');
  }
  const parsed = parseProfile(profile);
  if (!parsed.ok) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'The profile is invalid.', parsed.issues);
  }
  const now = nowIso();
  const result = db
    .prepare(
      `UPDATE profiles
       SET data = ?, schema_version = ?, revision = revision + 1, updated_at = ?
       WHERE user_id = ? AND revision = ?`,
    )
    .run(JSON.stringify(parsed.data), parsed.data.schemaVersion, now, userId, revision);
  if (result.changes !== 1) {
    const current = getProfileRecord(db, userId);
    throw new HttpError(409, 'CONFLICT', 'This profile was updated in another session.', [
      { path: 'revision', message: `Current revision is ${current?.revision ?? 'unknown'}.` },
    ]);
  }
  return getProfileRecord(db, userId);
}

export function listResumes(db, userId) {
  return db
    .prepare(
      `SELECT id, name, template_id, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      templateId: row.template_id,
      updatedAt: row.updated_at,
    }));
}

export function getResumeRecord(db, userId, resumeId) {
  const row = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(resumeId, userId);
  if (!row) return null;
  const parsed = parseResumeSettings(JSON.parse(row.settings));
  if (!parsed.ok) throw new Error('Stored resume failed validation.');
  return toResume(row, parsed.data);
}

export function createResume(db, userId, { name, templateId, fromResumeId } = {}) {
  const profile = getProfileRecord(db, userId);
  if (!profile) throw new HttpError(404, 'NOT_FOUND', 'Profile not found.');
  let settings = initialSettings(profile.profile);
  if (fromResumeId) {
    const source = getResumeRecord(db, userId, fromResumeId);
    if (!source) throw new HttpError(404, 'NOT_FOUND', 'Resume not found.');
    settings = source.settings;
  } else if (templateId) {
    settings = { ...settings, templateId: getTemplate(templateId).id };
  }
  const resumeName = cleanResumeName(name) ?? 'Untitled resume';
  const now = nowIso();
  const id = insertResume(db, { userId, profileId: profile.id, name: resumeName, settings, now });
  return getResumeRecord(db, userId, id);
}

export function saveResume(db, userId, resumeId, { revision, name, settings }) {
  if (!Number.isInteger(revision)) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'Resume revision is missing.');
  }
  const resumeName = cleanResumeName(name);
  if (!resumeName) throw new HttpError(422, 'VALIDATION_FAILED', 'Resume name is required.');
  const parsed = parseResumeSettings(settings);
  if (!parsed.ok) {
    throw new HttpError(422, 'VALIDATION_FAILED', 'The resume is invalid.', parsed.issues);
  }
  const now = nowIso();
  const result = db
    .prepare(
      `UPDATE resumes
       SET name = ?, template_id = ?, settings = ?, revision = revision + 1, updated_at = ?
       WHERE id = ? AND user_id = ? AND revision = ?`,
    )
    .run(resumeName, parsed.data.templateId, JSON.stringify(parsed.data), now, resumeId, userId, revision);
  if (result.changes !== 1) {
    const current = getResumeRecord(db, userId, resumeId);
    if (!current) throw new HttpError(404, 'NOT_FOUND', 'Resume not found.');
    throw new HttpError(409, 'CONFLICT', 'This resume was updated in another session.', [
      { path: 'revision', message: `Current revision is ${current.revision}.` },
    ]);
  }
  return getResumeRecord(db, userId, resumeId);
}

export function deleteResume(db, userId, resumeId) {
  const result = db.prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?').run(resumeId, userId);
  if (result.changes !== 1) throw new HttpError(404, 'NOT_FOUND', 'Resume not found.');
}

export function findSession(db, sessionHash) {
  const row = db
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, u.id, u.email, u.display_name, u.must_change_password
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
    .get(sessionHash);
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionHash);
    return null;
  }
  return row;
}

export function slideSession(db, sessionHash) {
  db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').run(sessionExpiry(), sessionHash);
}

function insertSession(db, token, userId, now) {
  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    hashToken(token),
    userId,
    sessionExpiry(),
    now,
  );
}

function insertResume(db, { userId, profileId, name, settings, now }) {
  const id = createId('res');
  db.prepare(
    `INSERT INTO resumes (id, user_id, profile_id, name, template_id, settings, revision, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  ).run(id, userId, profileId, name, settings.templateId, JSON.stringify(settings), now, now);
  return id;
}

function initialSettings(profile) {
  const template = getTemplate(DEFAULT_TEMPLATE_ID);
  return {
    ...createResumeSettings(template.id),
    sectionOrder: defaultSectionOrder(template, profile.sections),
  };
}

function toResume(row, settings) {
  return {
    id: row.id,
    name: row.name,
    revision: row.revision,
    updatedAt: row.updated_at,
    settings,
  };
}

function randomTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let value = '';
  for (const byte of randomBytes(12)) value += alphabet[byte % alphabet.length];
  return value;
}
