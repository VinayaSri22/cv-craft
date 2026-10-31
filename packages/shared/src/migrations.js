import { CURRENT_SCHEMA_VERSION } from './schema/profile.js';

/**
 * Ordered upgrades. Entry N converts a version-N document to version N+1.
 * Each function must be pure and must not depend on later schema code.
 * @type {Record<number, (doc: any) => any>}
 */
const UPGRADES = {};

/**
 * Brings a stored or imported profile document to CURRENT_SCHEMA_VERSION.
 * Documents without a version are treated as version 1.
 */
export function migrateProfile(doc) {
  let current = { ...doc, schemaVersion: doc?.schemaVersion ?? 1 };
  if (current.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Profile schema version ${current.schemaVersion} is newer than supported version ${CURRENT_SCHEMA_VERSION}`,
    );
  }
  while (current.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const upgrade = UPGRADES[current.schemaVersion];
    if (!upgrade) throw new Error(`No migration from schema version ${current.schemaVersion}`);
    current = { ...upgrade(current), schemaVersion: current.schemaVersion + 1 };
  }
  return current;
}
