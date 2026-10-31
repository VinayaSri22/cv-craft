import {
  createEmptyProfile,
  createResumeSettings,
  parseProfile,
  parseResumeSettings,
  sampleProfile,
} from '@cv-craft/shared';
import { DEFAULT_TEMPLATE_ID, defaultSectionOrder, getTemplate } from '@cv-craft/templates';

/** @param {object} profile */
export function createState(profile) {
  const template = getTemplate(DEFAULT_TEMPLATE_ID);
  return {
    profile,
    resume: {
      name: 'My resume',
      settings: {
        ...createResumeSettings(template.id),
        sectionOrder: defaultSectionOrder(template, profile.sections),
      },
    },
  };
}

export const createEmptyState = () => createState(createEmptyProfile());

export const createSampleState = () => createState(structuredClone(sampleProfile));

/**
 * Validates state restored from storage. Anything that fails validation is
 * replaced with a fresh state rather than crashing the editor.
 */
export function restoreState(persisted) {
  const profile = parseProfile(persisted?.profile);
  if (!profile.ok) return createEmptyState();
  const settings = parseResumeSettings(persisted?.resume?.settings);
  const fresh = createState(profile.data);
  return {
    profile: profile.data,
    resume: {
      name: typeof persisted.resume?.name === 'string' ? persisted.resume.name : fresh.resume.name,
      settings: settings.ok ? settings.data : fresh.resume.settings,
    },
  };
}
