import express from 'express';
import helmet from 'helmet';
import { parseProfile, parseResumeSettings } from '@cv-craft/shared';
import { createAuth } from './auth/middleware.js';
import { HttpError, errorHandler } from './http/errors.js';
import { DEFAULT_ORIGINS, requireAllowedOrigin } from './http/origin.js';
import { requireJson } from './http/requireJson.js';
import { authRoutes } from './routes/auth.js';
import { defaultUploadDir, attachPhotoSrc } from './photos.js';
import { profileRoutes } from './routes/profile.js';
import { resumeRoutes, sendPdf } from './routes/resumes.js';

function validationError(issues) {
  return new HttpError(422, 'VALIDATION_FAILED', 'The resume data is invalid.', issues);
}

/**
 * @param {{
 *   db: import('node:sqlite').DatabaseSync,
 *   renderer: { renderResume: (profile: object, settings: object) => Promise<{ html: string, title: string }> },
 *   printer: { print: (html: string) => Promise<Uint8Array> },
 *   logger?: Pick<Console, 'error'>,
 *   allowedOrigins?: string[],
 *   secureCookies?: boolean,
 *   rateLimit?: (key: string) => boolean,
 *   uploadDir?: string,
 * }} deps
 */
export function createApp({
  db,
  renderer,
  printer,
  logger = console,
  allowedOrigins = DEFAULT_ORIGINS,
  secureCookies = false,
  rateLimit,
  uploadDir = defaultUploadDir(),
}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());

  const auth = createAuth(db, { secureCookies });
  const renderPdf = async (profile, settings, userId) => {
    const printable = attachPhotoSrc(db, userId, profile, uploadDir);
    const rendered = await renderer.renderResume(printable, settings);
    return { ...rendered, pdf: await printer.print(rendered.html) };
  };

  const api = express.Router();
  api.use(express.json({ limit: '1mb' }));
  api.use(requireAllowedOrigin(allowedOrigins));

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  api.use('/auth', authRoutes({ db, auth, rateLimit }));
  api.use(auth.requireAuth);
  api.use(profileRoutes(db, { uploadDir }));
  api.use(resumeRoutes(db, { renderPdf }));

  api.post('/pdf', requireJson, async (req, res) => {
    const profile = parseProfile(req.body?.profile);
    if (!profile.ok) throw validationError(profile.issues.map(prefix('profile')));
    const settings = parseResumeSettings(req.body?.settings);
    if (!settings.ok) throw validationError(settings.issues.map(prefix('settings')));
    const { pdf, title } = await renderPdf(profile.data, settings.data, req.user.id);
    sendPdf(res, pdf, title);
  });

  api.use((_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Not found.')));

  app.use('/api', api);
  app.use(errorHandler(logger));
  return app;
}

const prefix = (root) => (issue) => ({
  ...issue,
  path: issue.path ? `${root}.${issue.path}` : root,
});
