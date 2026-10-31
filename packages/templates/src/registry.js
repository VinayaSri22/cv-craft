import { ClassicResume } from './classic/ClassicResume.jsx';
import {
  DEFAULT_TEMPLATE_ID,
  defaultSectionOrder,
  resolveOptions,
  templateCatalog,
} from './catalog.js';

const components = {
  classic: ClassicResume,
};

/**
 * Every available template, including its React component. Adding a template
 * means adding its metadata to the catalog and its component here.
 */
export const templates = templateCatalog.map((template) => ({
  ...template,
  Component: components[template.id],
}));

const byId = new Map(templates.map((template) => [template.id, template]));

/** Returns the full template, or the default one if the id is unknown. */
export function getTemplate(id) {
  return byId.get(id) ?? byId.get(DEFAULT_TEMPLATE_ID);
}

export { DEFAULT_TEMPLATE_ID, defaultSectionOrder, resolveOptions };
