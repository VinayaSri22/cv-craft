import classic from './classic/index.js';

/**
 * Every available template. Adding a template means adding one import and one
 * entry here; nothing else in the codebase enumerates templates.
 */
export const templates = [classic];

export const DEFAULT_TEMPLATE_ID = classic.id;

const byId = new Map(templates.map((template) => [template.id, template]));

/** Returns the template, or the default one if the id is unknown (e.g. a removed template). */
export function getTemplate(id) {
  return byId.get(id) ?? byId.get(DEFAULT_TEMPLATE_ID);
}

/**
 * Merges stored options with the template's defaults. Keys the template does
 * not declare are dropped; invalid values fall back to the default, so options
 * saved under another template never break rendering.
 */
export function resolveOptions(template, raw = {}) {
  const shape = template.optionsSchema.shape;
  const resolved = {};
  for (const [key, schema] of Object.entries(shape)) {
    const parsed = schema.safeParse(raw[key]);
    resolved[key] = parsed.success ? parsed.data : schema.parse(undefined);
  }
  return resolved;
}

/** Initial section order for a new resume: the template's preferred type order, stable within a type. */
export function defaultSectionOrder(template, sections) {
  const rank = (type) => {
    const index = template.defaultSectionOrder.indexOf(type);
    return index === -1 ? template.defaultSectionOrder.length : index;
  };
  return sections
    .map((section, index) => ({ section, index }))
    .sort((a, b) => rank(a.section.type) - rank(b.section.type) || a.index - b.index)
    .map(({ section }) => section.id);
}
