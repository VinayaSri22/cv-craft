import { afterAll, describe, expect, it } from 'vitest';
import { createResumeSettings, sampleProfile } from '@cv-craft/shared';
import { templates } from '@cv-craft/templates';
import { renderResume } from '../render/renderResume.jsx';
import { PdfPrinter } from './PdfPrinter.js';

/** Launches real Chromium; run with `npm run test:pdf`. */
describe.skipIf(!process.env.PDF_SMOKE)('PdfPrinter (real Chromium)', () => {
  const printer = new PdfPrinter();
  afterAll(() => printer.close());

  it.each(templates.map((t) => [t.id]))('prints the sample profile with "%s"', async (templateId) => {
    const { html } = renderResume(sampleProfile, createResumeSettings(templateId));
    const pdf = Buffer.from(await printer.print(html));
    const text = pdf.toString('latin1');

    expect(text.startsWith('%PDF-')).toBe(true);
    const pages = text.match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages.length).toBeLessThanOrEqual(3);
  }, 30_000);

  it('blocks network requests from resume content', async () => {
    let hit = false;
    const { createServer } = await import('node:http');
    const server = createServer((_req, res) => {
      hit = true;
      res.end();
    }).listen(0);
    const { port } = server.address();
    try {
      await printer.print(`<html><body><img src="http://127.0.0.1:${port}/x.png">hi</body></html>`);
    } finally {
      server.close();
    }
    expect(hit).toBe(false);
  }, 30_000);
});
