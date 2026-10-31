import { describe, expect, it } from 'vitest';
import {
  SECTION_TYPE_IDS,
  createEmptyItem,
  createEmptyProfile,
  createSection,
  parseProfile,
  parseResumeSettings,
  sampleProfile,
} from './index.js';

describe('profile schema', () => {
  it('accepts a new empty profile', () => {
    expect(parseProfile(createEmptyProfile()).ok).toBe(true);
  });

  it('accepts the sample profile unchanged', () => {
    const result = parseProfile(sampleProfile);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(sampleProfile);
  });

  it.each(SECTION_TYPE_IDS)('creates a valid empty %s item and section', (type) => {
    const profile = createEmptyProfile();
    profile.sections.push(createSection(type));
    expect(parseProfile(profile).ok).toBe(true);
    expect(createEmptyItem(type).id).toMatch(/^[a-z]+_/);
  });

  it('fills defaults for missing optional fields', () => {
    const result = parseProfile({ schemaVersion: 1 });
    expect(result.ok).toBe(true);
    expect(result.data.basics.links).toEqual([]);
    expect(result.data.sections).toEqual([]);
  });

  it('rejects duplicate ids across sections and items', () => {
    const profile = structuredClone(sampleProfile);
    profile.sections[1].items[0].id = 'exp_finpay';
    const result = parseProfile(profile);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ path: 'sections.1.items.0.id' });
  });

  it('rejects malformed dates but allows empty and partial dates', () => {
    const profile = structuredClone(sampleProfile);
    profile.sections[0].items[0].startDate = '2021';
    profile.sections[0].items[1].endDate = '';
    expect(parseProfile(profile).ok).toBe(true);

    profile.sections[0].items[0].startDate = 'April 2021';
    const result = parseProfile(profile);
    expect(result.ok).toBe(false);
    expect(result.issues[0].path).toBe('sections.0.items.0.startDate');
  });

  it('rejects unknown section types', () => {
    const profile = structuredClone(sampleProfile);
    profile.sections.push({ id: 'sec_x', type: 'hobbies', title: 'Hobbies', items: [] });
    expect(parseProfile(profile).ok).toBe(false);
  });

  it('rejects documents from a newer schema version', () => {
    const result = parseProfile({ ...sampleProfile, schemaVersion: 99 });
    expect(result.ok).toBe(false);
    expect(result.issues[0].path).toBe('schemaVersion');
  });
});

describe('resume settings schema', () => {
  it('fills defaults from a template id alone', () => {
    const result = parseResumeSettings({ templateId: 'classic' });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      sectionOrder: [],
      hiddenItems: [],
      overrides: { basics: {}, items: {} },
      options: {},
    });
  });

  it('requires a template id', () => {
    expect(parseResumeSettings({}).ok).toBe(false);
  });
});
