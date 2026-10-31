import classic from './classic/meta.js';
import modern from './modern/meta.js';
import sidebar from './sidebar/meta.js';

/**
 * Template metadata only: ids, options, and default section order.
 * The API imports this directly. React components live in the registry and
 * are loaded through Vite, because Node cannot import JSX.
 */
export const templateCatalog = [classic, sidebar, modern];

export const DEFAULT_TEMPLATE_ID = classic.id;

const byId = new Map(templateCatalog.map((template) => [template.id, template]));

/** Returns the template metadata, or the default template if the id is unknown. */
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
