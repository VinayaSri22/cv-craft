import {
  achievementItem,
  certificationItem,
  customItem,
  educationItem,
  experienceItem,
  projectItem,
  skillItem,
} from './schema/items.js';

/**
 * Field kinds understood by the editor:
 * text | textarea | date | checkbox | lines (one entry per line) | tags (comma-separated)
 *
 * @typedef {{ key: string, label: string, kind: 'text'|'textarea'|'date'|'checkbox'|'lines'|'tags', placeholder?: string }} FieldSpec
 * @typedef {{
 *   type: string,
 *   label: string,
 *   defaultTitle: string,
 *   idPrefix: string,
 *   itemSchema: import('zod').ZodTypeAny,
 *   fields: FieldSpec[],
 *   primaryField: string,
 * }} SectionTypeSpec
 */

/** @type {Record<string, SectionTypeSpec>} */
export const SECTION_TYPES = {
  experience: {
    type: 'experience',
    label: 'Experience',
    defaultTitle: 'Experience',
    idPrefix: 'exp',
    itemSchema: experienceItem,
    primaryField: 'role',
    fields: [
      { key: 'role', label: 'Role', kind: 'text', placeholder: 'Senior Engineer' },
      { key: 'organization', label: 'Organization', kind: 'text', placeholder: 'Acme Inc.' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'startDate', label: 'Start', kind: 'date' },
      { key: 'endDate', label: 'End', kind: 'date' },
      { key: 'current', label: 'I currently work here', kind: 'checkbox' },
      { key: 'bullets', label: 'Highlights (one per line)', kind: 'lines' },
    ],
  },
  education: {
    type: 'education',
    label: 'Education',
    defaultTitle: 'Education',
    idPrefix: 'edu',
    itemSchema: educationItem,
    primaryField: 'institution',
    fields: [
      { key: 'institution', label: 'Institution', kind: 'text' },
      { key: 'degree', label: 'Degree', kind: 'text', placeholder: 'B.Tech' },
      { key: 'field', label: 'Field of study', kind: 'text', placeholder: 'Computer Science' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'startDate', label: 'Start', kind: 'date' },
      { key: 'endDate', label: 'End', kind: 'date' },
      { key: 'grade', label: 'Grade', kind: 'text', placeholder: '8.9 CGPA' },
      { key: 'bullets', label: 'Details (one per line)', kind: 'lines' },
    ],
  },
  skills: {
    type: 'skills',
    label: 'Skills',
    defaultTitle: 'Skills',
    idPrefix: 'skl',
    itemSchema: skillItem,
    primaryField: 'name',
    fields: [
      { key: 'name', label: 'Skill', kind: 'text', placeholder: 'PostgreSQL' },
      { key: 'category', label: 'Category', kind: 'text', placeholder: 'Databases' },
      { key: 'level', label: 'Level', kind: 'text', placeholder: 'Advanced' },
    ],
  },
  projects: {
    type: 'projects',
    label: 'Projects',
    defaultTitle: 'Projects',
    idPrefix: 'prj',
    itemSchema: projectItem,
    primaryField: 'name',
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'role', label: 'Role', kind: 'text' },
      { key: 'url', label: 'URL', kind: 'text' },
      { key: 'startDate', label: 'Start', kind: 'date' },
      { key: 'endDate', label: 'End', kind: 'date' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'technologies', label: 'Technologies (comma-separated)', kind: 'tags' },
      { key: 'bullets', label: 'Highlights (one per line)', kind: 'lines' },
    ],
  },
  certifications: {
    type: 'certifications',
    label: 'Certifications',
    defaultTitle: 'Certifications',
    idPrefix: 'crt',
    itemSchema: certificationItem,
    primaryField: 'name',
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'issuer', label: 'Issuer', kind: 'text' },
      { key: 'date', label: 'Issued', kind: 'date' },
      { key: 'expiryDate', label: 'Expires', kind: 'date' },
      { key: 'credentialId', label: 'Credential ID', kind: 'text' },
      { key: 'url', label: 'URL', kind: 'text' },
    ],
  },
  achievements: {
    type: 'achievements',
    label: 'Achievements',
    defaultTitle: 'Achievements',
    idPrefix: 'ach',
    itemSchema: achievementItem,
    primaryField: 'title',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'issuer', label: 'Awarded by', kind: 'text' },
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'description', label: 'Description', kind: 'textarea' },
    ],
  },
  custom: {
    type: 'custom',
    label: 'Custom section',
    defaultTitle: 'Custom',
    idPrefix: 'cus',
    itemSchema: customItem,
    primaryField: 'heading',
    fields: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'subheading', label: 'Subheading', kind: 'text' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'startDate', label: 'Start', kind: 'date' },
      { key: 'endDate', label: 'End', kind: 'date' },
      { key: 'current', label: 'Ongoing', kind: 'checkbox' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'bullets', label: 'Points (one per line)', kind: 'lines' },
    ],
  },
};

export const SECTION_TYPE_IDS = /** @type {[string, ...string[]]} */ (Object.keys(SECTION_TYPES));
