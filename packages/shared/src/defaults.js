import { createId } from './ids.js';
import { CURRENT_SCHEMA_VERSION, linkSchema, profileSchema } from './schema/profile.js';
import { resumeSettingsSchema } from './schema/resume.js';
import { SECTION_TYPES } from './sectionTypes.js';

function specFor(type) {
  const spec = SECTION_TYPES[type];
  if (!spec) throw new Error(`Unknown section type "${type}"`);
  return spec;
}

/** @param {string} type */
export function createEmptyItem(type) {
  const spec = specFor(type);
  return spec.itemSchema.parse({ id: createId(spec.idPrefix) });
}

/**
 * @param {string} type
 * @param {{ title?: string, withItem?: boolean }} [opts]
 */
export function createSection(type, { title, withItem = true } = {}) {
  const spec = specFor(type);
  return {
    id: createId('sec'),
    type,
    title: title ?? spec.defaultTitle,
    items: withItem ? [createEmptyItem(type)] : [],
  };
}

export function createLink() {
  return linkSchema.parse({ id: createId('lnk'), label: '', url: '' });
}

/** A new profile starts with the sections almost everyone needs, each empty. */
export function createEmptyProfile() {
  return profileSchema.parse({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sections: ['experience', 'education', 'skills', 'projects'].map((type) =>
      createSection(type, { withItem: false }),
    ),
  });
}

/** @param {string} templateId */
export function createResumeSettings(templateId) {
  return resumeSettingsSchema.parse({ templateId });
}
