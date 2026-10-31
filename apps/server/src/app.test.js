import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createResumeSettings, sampleProfile } from '@cv-craft/shared';
import { createApp } from './app.js';
import { openDatabase } from './db/database.js';
import { PdfBusyError } from './pdf/PdfPrinter.js';
import { renderResume } from './render/renderResume.jsx';

const FAKE_PDF = new TextEncoder().encode('%PDF-1.7 fake');

async function setup({ print } = {}) {
  const db = openDatabase(':memory:');
  const printer = { print: vi.fn(print ?? (async () => FAKE_PDF)) };
  const renderer = { renderResume: vi.fn(async (...args) => renderResume(...args)) };
  const logger = { error: vi.fn() };
  const app = createApp({ renderer, printer, logger, db });
  const agent = request.agent(app);
  const registered = await agent
    .post('/api/auth/register')
    .send({ email: `pdf-${crypto.randomUUID()}@example.com`, password: 'password123' });
  if (registered.status !== 201) throw new Error(JSON.stringify(registered.body));
  return { app, agent, printer, renderer, logger, db };
}

const body = (patch = {}) => ({
  profile: sampleProfile,
  settings: createResumeSettings('classic'),
  ...patch,
});

describe('POST /api/pdf', () => {
  it('returns a PDF attachment named after the person', async () => {
    const { agent, printer } = await setup();
    const res = await agent.post('/api/pdf').send(body());

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe(
      `attachment; filename="Ananya-Rao-Resume.pdf"; filename*=UTF-8''Ananya-Rao-Resume.pdf`,
    );
    expect(res.headers['cache-control']).toBe('no-store');
    expect(Buffer.from(res.body).toString()).toBe('%PDF-1.7 fake');

    const html = printer.print.mock.calls[0][0];
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('Ananya Rao');
    expect(html).toContain('data-item-id="exp_finpay"');
  });

  it('applies resume settings such as hidden items', async () => {
    const { agent, printer } = await setup();
    await agent
      .post('/api/pdf')
      .send(body({ settings: { ...createResumeSettings('classic'), hiddenItems: ['exp_shopline'] } }));
    expect(printer.print.mock.calls[0][0]).not.toContain('data-item-id="exp_shopline"');
  });

  it('rejects invalid profiles with field-level details', async () => {
    const profile = structuredClone(sampleProfile);
    profile.sections[0].items[0].startDate = 'April 2021';
    const { agent, printer } = await setup();
    const res = await agent.post('/api/pdf').send(body({ profile }));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details[0].path).toBe('profile.sections.0.items.0.startDate');
    expect(printer.print).not.toHaveBeenCalled();
  });

  it('rejects missing settings', async () => {
    const { agent } = await setup();
    const res = await agent.post('/api/pdf').send({ profile: sampleProfile });
    expect(res.status).toBe(422);
    expect(res.body.error.details[0].path).toMatch(/^settings/);
  });

  it('requires JSON', async () => {
    const { agent } = await setup();
    const res = await agent.post('/api/pdf').type('form').send('profile=x');
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('reports malformed JSON as a client error', async () => {
    const { agent } = await setup();
    const res = await agent.post('/api/pdf').set('Content-Type', 'application/json').send('{"profile":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects bodies over 1 MB', async () => {
    const { agent } = await setup();
    const profile = { ...sampleProfile, summary: 'x'.repeat(1_100_000) };
    const res = await agent.post('/api/pdf').send(body({ profile }));
    expect(res.status).toBe(413);
  });

  it('returns 503 when the renderer is saturated', async () => {
    const { agent } = await setup({
      print: async () => {
        throw new PdfBusyError();
      },
    });
    const res = await agent.post('/api/pdf').send(body());
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('PDF_BUSY');
  });

  it('hides internal error details', async () => {
    const { agent, logger } = await setup({
      print: async () => {
        throw new Error('chromium exploded at /secret/path');
      },
    });
    const res = await agent.post('/api/pdf').send(body());
    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('other routes', () => {
  it('serves a health check', async () => {
    const { app } = await setup();
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ ok: true });
  });

  it('returns JSON 404s for unknown API routes', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('requires a session for PDF rendering', async () => {
    const { app } = await setup();
    const res = await request(app).post('/api/pdf').send(body());
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});
