import {
  SECTION_TYPES,
  createEmptyItem,
  createLink,
  createSection,
  effectiveSectionOrder,
} from '@cv-craft/shared';
import { getTemplate } from '@cv-craft/templates';

/**
 * Every change to editor state goes through one of these. Each receives an
 * Immer draft of `{ profile, resume }` and mutates it in place.
 *
 * Profile actions change facts and affect every resume. Resume actions
 * (order, visibility, template, options) affect only this resume.
 */

const findSection = (state, sectionId) => state.profile.sections.find((s) => s.id === sectionId);

function move(list, index, delta) {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= list.length) return;
  const [entry] = list.splice(index, 1);
  list.splice(target, 0, entry);
}

function removeId(list, id) {
  const index = list.indexOf(id);
  if (index !== -1) list.splice(index, 1);
}

// Profile: basics and summary

export function updateBasics(state, patch) {
  Object.assign(state.profile.basics, patch);
}

export function updateSummary(state, summary) {
  state.profile.summary = summary;
}

export function addLink(state) {
  state.profile.basics.links.push(createLink());
}

export function updateLink(state, linkId, patch) {
  const link = state.profile.basics.links.find((l) => l.id === linkId);
  if (link) Object.assign(link, patch);
}

export function removeLink(state, linkId) {
  state.profile.basics.links = state.profile.basics.links.filter((l) => l.id !== linkId);
}

// Profile: sections and items

/** @returns {string} the new section id */
export function addSection(state, type, title) {
  if (!SECTION_TYPES[type]) throw new Error(`Unknown section type "${type}"`);
  const section = createSection(type, { title: title?.trim() || undefined });
  state.profile.sections.push(section);
  state.resume.settings.sectionOrder = [
    ...effectiveSectionOrder(state.profile.sections, state.resume.settings.sectionOrder).filter(
      (id) => id !== section.id,
    ),
    section.id,
  ];
  return section.id;
}

export function renameSection(state, sectionId, title) {
  const section = findSection(state, sectionId);
  if (section) section.title = title;
}

export function removeSection(state, sectionId) {
  const section = findSection(state, sectionId);
  if (!section) return;
  state.profile.sections = state.profile.sections.filter((s) => s.id !== sectionId);
  const settings = state.resume.settings;
  removeId(settings.sectionOrder, sectionId);
  removeId(settings.hiddenSections, sectionId);
  for (const item of section.items) {
    removeId(settings.hiddenItems, item.id);
    delete settings.overrides.items[item.id];
  }
}

/** @returns {string | undefined} the new item id */
export function addItem(state, sectionId) {
  const section = findSection(state, sectionId);
  if (!section) return undefined;
  const item = createEmptyItem(section.type);
  section.items.push(item);
  return item.id;
}

export function updateItem(state, sectionId, itemId, patch) {
  const item = findSection(state, sectionId)?.items.find((i) => i.id === itemId);
  if (item) Object.assign(item, patch);
}

export function removeItem(state, sectionId, itemId) {
  const section = findSection(state, sectionId);
  if (!section) return;
  section.items = section.items.filter((i) => i.id !== itemId);
  removeId(state.resume.settings.hiddenItems, itemId);
  delete state.resume.settings.overrides.items[itemId];
}

export function moveItem(state, sectionId, itemId, delta) {
  const section = findSection(state, sectionId);
  if (!section) return;
  move(section.items, section.items.findIndex((i) => i.id === itemId), delta);
}

// Resume: composition and presentation

export function moveSection(state, sectionId, delta) {
  const order = effectiveSectionOrder(state.profile.sections, state.resume.settings.sectionOrder);
  move(order, order.indexOf(sectionId), delta);
  state.resume.settings.sectionOrder = order;
}

/** Hides or shows a section or item in this resume only. */
export function toggleHidden(state, kind, id) {
  const list =
    kind === 'section' ? state.resume.settings.hiddenSections : state.resume.settings.hiddenItems;
  if (list.includes(id)) removeId(list, id);
  else list.push(id);
}

export function setTemplate(state, templateId) {
  const template = getTemplate(templateId);
  state.resume.settings.templateId = template.id;
  state.resume.settings.templateVersion = template.version;
}

export function setOption(state, key, value) {
  state.resume.settings.options[key] = value;
}

export function renameResume(state, name) {
  state.resume.name = name;
}
