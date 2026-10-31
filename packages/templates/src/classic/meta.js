import { standardOptions } from '../options.js';

const { optionsSchema, optionControls } = standardOptions('#1f3a5f');

/** Template description with no React component, so plain Node can import it. */
const classic = {
  id: 'classic',
  version: 1,
  name: 'Classic',
  description: 'Single column with conventional headings. The safest choice for applicant tracking systems.',
  defaultSectionOrder: [
    'experience',
    'projects',
    'education',
    'skills',
    'certifications',
    'achievements',
    'custom',
  ],
  optionsSchema,
  optionControls,
};

export default classic;
