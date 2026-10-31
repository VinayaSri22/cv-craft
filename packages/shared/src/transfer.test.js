import { describe, expect, it } from 'vitest';
import { createResumeSettings, sampleProfile } from './index.js';
import { buildExport, parseImport } from './transfer.js';

const resume = { name: 'Backend', settings: createResumeSettings('classic') };

describe('export file', () => {
  it('wraps the profile and resumes and drops the photo', () => {
    const profile = structuredClone(sampleProfile);
    profile.basics.photo = { id: 'ph_1', width: 600, height: 600 };
    const file = buildExport({ profile, resumes: [resume], exportedAt: '2026-10-31T00:00:00.000Z' });

    expect(file.format).toBe('cv-craft-export');
    expect(file.profile.basics.photo).toBeNull();
    expect(file.profile.basics.fullName).toBe(sampleProfile.basics.fullName);
    expect(file.resumes).toEqual([resume]);
    expect(parseImport(file).ok).toBe(true);
  });

  it('rejects a file that is not an export', () => {
    const result = parseImport({ hello: true });
    expect(result.ok).toBe(false);
    expect(result.issues[0].path).toBe('format');
  });

  it('rejects an export with no resumes', () => {
    const file = buildExport({ profile: sampleProfile, resumes: [resume] });
    file.resumes = [];
    expect(parseImport(file).ok).toBe(false);
  });
});
