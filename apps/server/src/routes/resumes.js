import { Router } from 'express';
import {
  createResume,
  deleteResume,
  getProfileRecord,
  getResumeRecord,
  listResumes,
  saveResume,
} from '../accounts.js';
import { attachmentHeader } from '../http/contentDisposition.js';
import { HttpError } from '../http/errors.js';
import { requireJson } from '../http/requireJson.js';

export function resumeRoutes(db, { renderPdf }) {
  const router = Router();

  router.get('/resumes', (req, res) => {
    res.json({ resumes: listResumes(db, req.user.id) });
  });

  router.post('/resumes', requireJson, (req, res) => {
    const resume = createResume(db, req.user.id, req.body ?? {});
    res.status(201).json(resume);
  });

  router.get('/resumes/:id', (req, res) => {
    const resume = getResumeRecord(db, req.user.id, req.params.id);
    if (!resume) throw new HttpError(404, 'NOT_FOUND', 'Resume not found.');
    res.json(resume);
  });

  router.put('/resumes/:id', requireJson, (req, res) => {
    res.json(
      saveResume(db, req.user.id, req.params.id, {
        revision: req.body?.revision,
        name: req.body?.name,
        settings: req.body?.settings,
      }),
    );
  });

  router.delete('/resumes/:id', (req, res) => {
    deleteResume(db, req.user.id, req.params.id);
    res.json({ ok: true });
  });

  router.get('/resumes/:id/pdf', async (req, res) => {
    const profile = getProfileRecord(db, req.user.id);
    const resume = getResumeRecord(db, req.user.id, req.params.id);
    if (!profile || !resume) throw new HttpError(404, 'NOT_FOUND', 'Resume not found.');
    const { pdf, title } = await renderPdf(profile.profile, resume.settings, req.user.id);
    sendPdf(res, pdf, title);
  });

  return router;
}

export function sendPdf(res, pdf, title) {
  res
    .status(200)
    .set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': attachmentHeader(title),
      'Content-Length': String(pdf.byteLength),
      'Cache-Control': 'no-store',
    })
    .end(Buffer.from(pdf));
}
