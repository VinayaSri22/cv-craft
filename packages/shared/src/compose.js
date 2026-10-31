/**
 * Builds the render model a template draws: the profile with one resume's
 * choices (order, visibility, overrides) applied. Pure and deterministic.
 *
 * @param {object} profile    A valid profile document.
 * @param {object} settings   Resume settings.
 * @param {{ includeEmpty?: boolean }} [opts]
 *   includeEmpty keeps blank items and empty sections, so the editor can show
 *   entries the user just added. Print and PDF output leave it off.
 * @returns {{ basics: object, summary: string, sections: object[] }}
 */
export function compose(profile, settings, { includeEmpty = false } = {}) {
  const overrides = settings.overrides ?? {};
  const itemOverrides = overrides.items ?? {};
  const hiddenSections = new Set(settings.hiddenSections ?? []);
  const hiddenItems = new Set(settings.hiddenItems ?? []);

  const sections = orderSections(profile.sections, settings.sectionOrder ?? [])
    .filter((section) => !hiddenSections.has(section.id))
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => !hiddenItems.has(item.id))
        .map((item) => cleanItem({ ...item, ...itemOverrides[item.id] }))
        .filter((item) => includeEmpty || !isBlankItem(item)),
    }))
    .filter((section) => includeEmpty || section.items.length > 0);

  return {
    basics: { ...profile.basics, ...overrides.basics },
    summary: overrides.summary ?? profile.summary,
    sections,
  };
}

function orderSections(sections, order) {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const ordered = order.filter((id) => byId.has(id)).map((id) => byId.get(id));
  const listed = new Set(ordered.map((section) => section.id));
  return [...ordered, ...sections.filter((section) => !listed.has(section.id))];
}

/**
 * The section ids in the order a resume displays them: listed ids that still
 * exist, then unlisted sections in profile order.
 * @param {{ id: string }[]} sections
 * @param {string[]} order
 * @returns {string[]}
 */
export function effectiveSectionOrder(sections, order) {
  return orderSections(sections, order).map((section) => section.id);
}

/** Drops blank lines and blank tags that exist only because the user is mid-edit. */
function cleanItem(item) {
  const out = { ...item };
  for (const [key, value] of Object.entries(out)) {
    if (Array.isArray(value)) {
      out[key] = value.map((v) => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);
    }
  }
  return out;
}

function isBlankItem(item) {
  return Object.entries(item).every(([key, value]) => {
    if (key === 'id' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.length === 0;
    return typeof value !== 'string' || value.trim() === '';
  });
}
