import { standardOptions } from '../options.js';

const { optionsSchema, optionControls } = standardOptions('#1f4b3a');

/** Two columns: contact and supporting sections in a rail, the story in the main column. */
const sidebar = {
  id: 'sidebar',
  version: 1,
  name: 'Sidebar',
  description: 'Two columns. Contact, skills, education, and certifications sit in a rail beside the main story.',
  previewMode: 'slice',
  defaultSectionOrder: [
    'experience',
    'projects',
    'achievements',
    'custom',
    'skills',
    'education',
    'certifications',
  ],
  optionsSchema,
  optionControls,
};

export default sidebar;
