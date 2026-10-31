import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

/**
 * @param {string} prefix e.g. "sec", "exp"
 * @returns {string}
 */
export function createId(prefix) {
  return `${prefix}_${nanoid()}`;
}
