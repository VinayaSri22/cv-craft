import { z } from 'zod';
import { SECTION_TYPES } from '../sectionTypes.js';
import { id, shortText, text } from './primitives.js';

export const CURRENT_SCHEMA_VERSION = 1;

export const linkSchema = z.object({
  id,
  label: shortText,
  url: shortText,
});

export const photoRefSchema = z.object({
  id,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const basicsSchema = z.object({
  fullName: shortText,
  headline: shortText,
  email: shortText,
  phone: shortText,
  location: shortText,
  photo: photoRefSchema.nullable().default(null),
  links: z.array(linkSchema).max(20).default([]),
});

const sectionVariants = Object.values(SECTION_TYPES).map((spec) =>
  z.object({
    id,
    type: z.literal(spec.type),
    title: shortText,
    items: z.array(spec.itemSchema).max(200).default([]),
  }),
);

export const sectionSchema = z.discriminatedUnion(
  'type',
  /** @type {[any, any, ...any[]]} */ (sectionVariants),
);

export const profileSchema = z
  .object({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
    basics: basicsSchema.prefault({}),
    summary: text,
    sections: z.array(sectionSchema).max(50).default([]),
  })
  .superRefine((profile, ctx) => {
    const seen = new Set();
    const check = (value, path) => {
      if (seen.has(value)) {
        ctx.addIssue({ code: 'custom', path, message: `Duplicate id "${value}"` });
      }
      seen.add(value);
    };
    profile.basics.links.forEach((link, i) => check(link.id, ['basics', 'links', i, 'id']));
    profile.sections.forEach((section, s) => {
      check(section.id, ['sections', s, 'id']);
      section.items.forEach((item, i) => check(item.id, ['sections', s, 'items', i, 'id']));
    });
  });
