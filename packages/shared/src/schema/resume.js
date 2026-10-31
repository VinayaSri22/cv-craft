import { z } from 'zod';
import { id } from './primitives.js';

export const overridesSchema = z.object({
  basics: z.record(z.string(), z.string()).default({}),
  summary: z.string().max(5000).optional(),
  items: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
});

export const resumeSettingsSchema = z.object({
  templateId: z.string().min(1),
  templateVersion: z.number().int().positive().default(1),
  sectionOrder: z.array(id).default([]),
  hiddenSections: z.array(id).default([]),
  hiddenItems: z.array(id).default([]),
  overrides: overridesSchema.prefault({}),
  options: z.record(z.string(), z.unknown()).default({}),
});
