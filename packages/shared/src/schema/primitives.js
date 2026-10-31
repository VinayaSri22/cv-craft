import { z } from 'zod';

/** Empty string while drafting, otherwise YYYY, YYYY-MM, or YYYY-MM-DD. */
export const partialDate = z
  .string()
  .regex(/^(\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?)?$/, 'Use YYYY, YYYY-MM, or YYYY-MM-DD')
  .default('');

export const text = z.string().max(5000).default('');

export const shortText = z.string().max(300).default('');

export const textList = z.array(z.string().max(2000)).max(100).default([]);

export const id = z.string().min(1).max(64);
