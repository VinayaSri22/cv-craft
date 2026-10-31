import { z } from 'zod';
import { id, partialDate, shortText, text, textList } from './primitives.js';

export const experienceItem = z.object({
  id,
  role: shortText,
  organization: shortText,
  location: shortText,
  startDate: partialDate,
  endDate: partialDate,
  current: z.boolean().default(false),
  bullets: textList,
});

export const educationItem = z.object({
  id,
  degree: shortText,
  field: shortText,
  institution: shortText,
  location: shortText,
  startDate: partialDate,
  endDate: partialDate,
  grade: shortText,
  bullets: textList,
});

export const skillItem = z.object({
  id,
  name: shortText,
  category: shortText,
  level: shortText,
});

export const projectItem = z.object({
  id,
  name: shortText,
  role: shortText,
  url: shortText,
  startDate: partialDate,
  endDate: partialDate,
  description: text,
  technologies: textList,
  bullets: textList,
});

export const certificationItem = z.object({
  id,
  name: shortText,
  issuer: shortText,
  date: partialDate,
  expiryDate: partialDate,
  credentialId: shortText,
  url: shortText,
});

export const achievementItem = z.object({
  id,
  title: shortText,
  issuer: shortText,
  date: partialDate,
  description: text,
});

export const customItem = z.object({
  id,
  heading: shortText,
  subheading: shortText,
  location: shortText,
  startDate: partialDate,
  endDate: partialDate,
  current: z.boolean().default(false),
  description: text,
  bullets: textList,
});
