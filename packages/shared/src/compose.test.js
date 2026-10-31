import { describe, expect, it } from 'vitest';
import { compose, createEmptyItem, createResumeSettings, createSection, sampleProfile } from './index.js';

const settings = (overrides = {}) => ({ ...createResumeSettings('classic'), ...overrides });
const sectionIds = (model) => model.sections.map((s) => s.id);

describe('compose', () => {
  it('keeps profile order when the resume has no order', () => {
    const model = compose(sampleProfile, settings());
    expect(sectionIds(model)).toEqual(sampleProfile.sections.map((s) => s.id));
  });

  it('applies resume order and appends sections it does not list', () => {
    const model = compose(sampleProfile, settings({ sectionOrder: ['sec_skills', 'sec_education'] }));
    expect(sectionIds(model).slice(0, 3)).toEqual(['sec_skills', 'sec_education', 'sec_experience']);
    expect(model.sections).toHaveLength(sampleProfile.sections.length);
  });

  it('ignores ids that no longer exist in the profile', () => {
    const model = compose(sampleProfile, settings({ sectionOrder: ['sec_gone', 'sec_skills'] }));
    expect(sectionIds(model)[0]).toBe('sec_skills');
  });

  it('hides sections and items for this resume only', () => {
    const model = compose(
      sampleProfile,
      settings({ hiddenSections: ['sec_projects'], hiddenItems: ['exp_shopline'] }),
    );
    expect(sectionIds(model)).not.toContain('sec_projects');
    expect(model.sections[0].items.map((i) => i.id)).toEqual(['exp_finpay']);
    expect(sampleProfile.sections[0].items).toHaveLength(2);
  });

  it('applies basics, summary, and item overrides without mutating the profile', () => {
    const model = compose(
      sampleProfile,
      settings({
        overrides: {
          basics: { headline: 'Platform Engineer' },
          summary: 'Tailored.',
          items: { exp_finpay: { bullets: ['Only this bullet.'] } },
        },
      }),
    );
    expect(model.basics.headline).toBe('Platform Engineer');
    expect(model.basics.fullName).toBe(sampleProfile.basics.fullName);
    expect(model.summary).toBe('Tailored.');
    expect(model.sections[0].items[0].bullets).toEqual(['Only this bullet.']);
    expect(sampleProfile.sections[0].items[0].bullets).toHaveLength(3);
  });

  it('drops blank items, blank lines, and empty sections by default', () => {
    const profile = structuredClone(sampleProfile);
    profile.sections.push(createSection('custom', { title: 'Empty' }));
    profile.sections[0].items.push(createEmptyItem('experience'));
    profile.sections[0].items[0].bullets.push('', '   ');

    const model = compose(profile, settings());
    expect(sectionIds(model)).not.toContain(profile.sections.at(-1).id);
    expect(model.sections[0].items).toHaveLength(2);
    expect(model.sections[0].items[0].bullets).toHaveLength(3);
  });

  it('keeps blank items and empty sections with includeEmpty', () => {
    const profile = structuredClone(sampleProfile);
    const added = createSection('custom', { title: 'New' });
    profile.sections.push(added);

    const model = compose(profile, settings(), { includeEmpty: true });
    expect(model.sections.at(-1).id).toBe(added.id);
    expect(model.sections.at(-1).items).toHaveLength(1);
  });
});
