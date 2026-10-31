import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  SECTION_TYPE_IDS,
  compose,
  createEmptyProfile,
  createResumeSettings,
  sampleProfile,
} from '@cv-craft/shared';
import { defaultSectionOrder, getTemplate, resolveOptions, templates } from './index.js';

function render(template, profile, settingsPatch = {}) {
  const settings = { ...createResumeSettings(template.id), ...settingsPatch };
  const model = compose(profile, settings);
  const options = resolveOptions(template, settings.options);
  const html = renderToStaticMarkup(<template.Component model={model} options={options} />);
  return { html, model };
}

const longProfile = (() => {
  const profile = structuredClone(sampleProfile);
  const experience = profile.sections[0];
  for (let i = 0; i < 25; i++) {
    experience.items.push({
      ...experience.items[1],
      id: `exp_long_${i}`,
      bullets: ['A very long bullet '.repeat(30)],
    });
  }
  profile.basics.fullName = 'Zoë Ølsen-Nakamura 山田 محمد';
  return profile;
})();

describe.each(templates.map((t) => [t.id, t]))('template "%s"', (_id, template) => {
  it('declares the required contract fields', () => {
    expect(template).toMatchObject({
      id: expect.any(String),
      version: expect.any(Number),
      name: expect.any(String),
      Component: expect.any(Function),
    });
    expect(Array.isArray(template.defaultSectionOrder)).toBe(true);
    expect(() => template.optionsSchema.parse({})).not.toThrow();
  });

  it('renders an empty profile without throwing', () => {
    expect(() => render(template, createEmptyProfile())).not.toThrow();
  });

  it('renders every visible section and item from the sample profile', () => {
    const { html, model } = render(template, sampleProfile);
    const types = new Set(model.sections.map((s) => s.type));
    expect(types).toEqual(new Set(SECTION_TYPE_IDS));
    for (const section of model.sections) {
      expect(html).toContain(`data-section-id="${section.id}"`);
      for (const item of section.items) {
        expect(html).toContain(`data-item-id="${item.id}"`);
      }
    }
  });

  it('omits hidden content', () => {
    const { html } = render(template, sampleProfile, {
      hiddenSections: ['sec_projects'],
      hiddenItems: ['exp_shopline'],
    });
    expect(html).not.toContain('data-section-id="sec_projects"');
    expect(html).not.toContain('data-item-id="exp_shopline"');
  });

  it('renders long content and non-Latin names', () => {
    const { html } = render(template, longProfile);
    expect(html).toContain('data-item-id="exp_long_24"');
    expect(html).toContain('山田');
  });

  it('escapes user content instead of rendering it as HTML', () => {
    const profile = structuredClone(sampleProfile);
    profile.summary = '<script>alert(1)</script>';
    const { html } = render(template, profile);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('falls back to defaults for invalid or foreign options', () => {
    const options = resolveOptions(template, { pageSize: 'Tabloid', fromOtherTemplate: true });
    expect(options).toEqual(template.optionsSchema.parse({}));
  });

  it('renders section types it has no dedicated renderer for', () => {
    const settings = createResumeSettings(template.id);
    const model = compose(sampleProfile, settings);
    model.sections.push({
      id: 'sec_future',
      type: 'publications',
      title: 'Publications',
      items: [{ id: 'pub_1', title: 'A Paper', date: '2024' }],
    });
    const html = renderToStaticMarkup(
      <template.Component model={model} options={resolveOptions(template)} />,
    );
    expect(html).toContain('data-item-id="pub_1"');
    expect(html).toContain('A Paper');
  });
});

describe('sidebar', () => {
  it('places a rail beside the main column', () => {
    const template = getTemplate('sidebar');
    const { html } = render(template, sampleProfile);
    const railAt = html.indexOf('class="sidebar-rail"');
    const mainAt = html.indexOf('class="sidebar-main"');
    expect(html).toContain('class="sidebar-layout"');
    expect(railAt).toBeGreaterThan(-1);
    expect(mainAt).toBeGreaterThan(railAt);
    const rail = html.slice(railAt, mainAt);
    expect(rail).toContain('data-section-id="sec_skills"');
    expect(rail).toContain('data-section-id="sec_education"');
    expect(html.slice(mainAt)).toContain('data-section-id="sec_experience"');
  });
});

describe('photo', () => {
  it('stays hidden until the resume turns it on', () => {
    const template = getTemplate('classic');
    const profile = structuredClone(sampleProfile);
    profile.basics.photo = { id: 'ph_abc', width: 600, height: 600, src: 'data:image/jpeg;base64,abc' };
    expect(render(template, profile).html).not.toContain('<img');
    const shown = render(template, profile, { options: { showPhoto: true } });
    expect(shown.html).toContain('src="data:image/jpeg;base64,abc"');
    expect(shown.html).toContain('class="classic-photo"');
  });
});

describe('registry', () => {
  it('falls back to the default template for unknown ids', () => {
    expect(getTemplate('does-not-exist').id).toBe(templates[0].id);
  });

  it('orders sections by template preference, stable within a type', () => {
    const order = defaultSectionOrder(getTemplate('classic'), sampleProfile.sections);
    expect(order.slice(0, 3)).toEqual(['sec_experience', 'sec_projects', 'sec_education']);
    expect(order).toHaveLength(sampleProfile.sections.length);
  });
});
