import express from 'express';
import helmet from 'helmet';
import { parseProfile, parseResumeSettings } from '@cv-craft/shared';
import { attachmentHeader } from './http/contentDisposition.js';
import { HttpError, errorHandler } from './http/errors.js';

/** Mutating API routes accept JSON only, which also blocks simple cross-site form posts. */
function requireJson(req, _res, next) {
  if (!req.is('application/json')) {
    return next(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.'));
  }
  next();
}

function validationError(issues) {
  return new HttpError(422, 'VALIDATION_FAILED', 'The resume data is invalid.', issues);
}

/**
 * @param {{
 *   renderer: { renderResume: (profile: object, settings: object) => Promise<{ html: string, title: string }> },
 *   printer: { print: (html: string) => Promise<Uint8Array> },
 *   logger?: Pick<Console, 'error'>,
 * }} deps
 */
export function createApp({ renderer, printer, logger = console }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());

  const api = express.Router();
  api.use(express.json({ limit: '1mb' }));

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  /**
   * Renders the posted profile + resume settings to a PDF. Stateless: nothing
   * is stored. Once profiles are persisted, GET /resumes/:id/pdf will reuse
   * the same renderer with data loaded from the database.
   */
  api.post('/pdf', requireJson, async (req, res) => {
    const profile = parseProfile(req.body?.profile);
    if (!profile.ok) throw validationError(profile.issues.map(prefix('profile')));
    const settings = parseResumeSettings(req.body?.settings);
    if (!settings.ok) throw validationError(settings.issues.map(prefix('settings')));

    const { html, title } = await renderer.renderResume(profile.data, settings.data);
    const pdf = await printer.print(html);

    res
      .status(200)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': attachmentHeader(title),
        'Content-Length': String(pdf.byteLength),
        'Cache-Control': 'no-store',
      })
      .end(Buffer.from(pdf));
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
