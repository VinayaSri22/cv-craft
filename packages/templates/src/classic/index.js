import { z } from 'zod';
import { ClassicResume } from './ClassicResume.jsx';

export default {
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
  optionsSchema: z.object({
    accent: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default('#1f3a5f'),
    density: z.enum(['comfortable', 'compact']).default('comfortable'),
    pageSize: z.enum(['A4', 'Letter']).default('A4'),
  }),
  optionControls: [
    { key: 'accent', label: 'Accent color', kind: 'color' },
    {
      key: 'density',
      label: 'Density',
      kind: 'select',
      choices: [
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'compact', label: 'Compact' },
      ],
    },
    {
      key: 'pageSize',
      label: 'Page size',
      kind: 'select',
      choices: [
        { value: 'A4', label: 'A4' },
        { value: 'Letter', label: 'US Letter' },
      ],
    },
  ],
  Component: ClassicResume,
};
