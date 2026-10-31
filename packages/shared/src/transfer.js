import { z } from 'zod';
import { resumeSettingsSchema } from './schema/resume.js';
import { parseProfile } from './validate.js';

export const EXPORT_FORMAT = 'cv-craft-export';

const resumeFileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  settings: resumeSettingsSchema,
});

/**
 * A portable copy of one account's facts and resume versions.
 * The photo file is not included. `basics.photo` is cleared so an import
 * does not point at a picture that lives on another machine.
 *
 * @param {{ profile: object, resumes: { name: string, settings: object }[], exportedAt?: string }} input
 */
export function buildExport({ profile, resumes, exportedAt = new Date().toISOString() }) {
  return {
    format: EXPORT_FORMAT,
    formatVersion: 1,
    exportedAt,
    profile: {
      ...profile,
      basics: { ...profile.basics, photo: null },
    },
    resumes: resumes.map((resume) => ({ name: resume.name, settings: resume.settings })),
  };
}

/**
 * Checks an imported file. The profile is migrated to the current schema.
 * Any photo reference in the file is dropped.
 * @returns {{ ok: true, data: { profile: object, resumes: { name: string, settings: object }[] } } | { ok: false, issues: { path: string, message: string }[] }}
 */
export function parseImport(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, issues: [{ path: '', message: 'The file is not a cv-craft export.' }] };
  }
  if (input.format !== EXPORT_FORMAT) {
    return { ok: false, issues: [{ path: 'format', message: 'The file is not a cv-craft export.' }] };
  }
  if (input.formatVersion !== 1) {
    return {
      ok: false,
      issues: [{ path: 'formatVersion', message: `Unsupported export version ${input.formatVersion}.` }],
    };
  }

  const profile = parseProfile(withoutPhoto(input.profile));
  if (!profile.ok) {
    return { ok: false, issues: profile.issues.map((issue) => ({ ...issue, path: prefix('profile', issue.path) })) };
  }

  const resumes = z.array(resumeFileSchema).min(1).max(20).safeParse(input.resumes);
  if (!resumes.success) {
    return {
      ok: false,
      issues: resumes.error.issues.map((issue) => ({
        path: prefix('resumes', issue.path.join('.')),
        message: issue.message,
      })),
    };
  }

  return {
    ok: true,
    data: {
      profile: profile.data,
      resumes: resumes.data,
    },
  };
}

function withoutPhoto(profile) {
  if (!profile || typeof profile !== 'object') return profile;
  const basics = profile.basics && typeof profile.basics === 'object' ? { ...profile.basics, photo: null } : profile.basics;
  return { ...profile, basics };
}

function prefix(root, path) {
  return path ? `${root}.${path}` : root;
}
