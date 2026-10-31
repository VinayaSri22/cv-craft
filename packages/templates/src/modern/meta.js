import { standardOptions } from '../options.js';

const { optionsSchema, optionControls } = standardOptions('#0f6e8c');

/** Single column, sans-serif, with the name aligned left. */
const modern = {
  id: 'modern',
  version: 1,
  name: 'Modern',
  description: 'Single column in a sans-serif face. Name and headline lead on the left.',
  defaultSectionOrder: [
    'experience',
    'projects',
    'skills',
    'education',
    'certifications',
    'achievements',
    'custom',
  ],
  optionsSchema,
  optionControls,
};

export default modern;
