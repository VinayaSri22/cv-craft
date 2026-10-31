import { migrateProfile } from './migrations.js';
import { profileSchema } from './schema/profile.js';
import { resumeSettingsSchema } from './schema/resume.js';

/**
 * @typedef {{ path: string, message: string }} Issue
 * @typedef {{ ok: true, data: any } | { ok: false, issues: Issue[] }} Result
 */

function toResult(parsed) {
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

/** Migrates, then validates. Use for anything loaded from storage or a file. @returns {Result} */
export function parseProfile(input) {
  let migrated;
  try {
    migrated = migrateProfile(input);
  } catch (error) {
    return { ok: false, issues: [{ path: 'schemaVersion', message: error.message }] };
  }
  return toResult(profileSchema.safeParse(migrated));
}

/** @returns {Result} */
export function parseResumeSettings(input) {
  return toResult(resumeSettingsSchema.safeParse(input));
}
