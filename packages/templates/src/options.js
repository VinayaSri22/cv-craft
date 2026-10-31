import { z } from 'zod';

/** Accent, density, and page size. Shared by every built-in template. */
export function standardOptions(accentDefault) {
  return {
    optionsSchema: z.object({
      accent: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default(accentDefault),
      density: z.enum(['comfortable', 'compact']).default('comfortable'),
      pageSize: z.enum(['A4', 'Letter']).default('A4'),
      showPhoto: z.boolean().default(false),
    }),
    optionControls: [
      { key: 'showPhoto', label: 'Photo', kind: 'checkbox' },
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
  };
}
