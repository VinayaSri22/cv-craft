import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);

/** OWASP-recommended argon2id parameters. Node's `memory` unit is KiB. */
const MEMORY = 19456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;

const DUMMY_NONCE = randomBytes(16);

/**
 * Stored form: argon2id$<passes>$<memory>$<nonce>$<hash>
 * Parameters travel with the hash so they can be raised later.
 * @param {string} password
 */
export async function hashPassword(password) {
  const nonce = randomBytes(16);
  const hash = await digest(password, nonce, PASSES, MEMORY);
  return `argon2id$${PASSES}$${MEMORY}$${nonce.toString('base64url')}$${hash.toString('base64url')}`;
}

/**
 * @param {string | null | undefined} stored
 * @param {string} password
 */
export async function verifyPassword(stored, password) {
  const parsed = parseStored(stored);
  const actual = await digest(password, parsed?.nonce ?? DUMMY_NONCE, parsed?.passes ?? PASSES, parsed?.memory ?? MEMORY);
  if (!parsed || actual.length !== parsed.hash.length) return false;
  return timingSafeEqual(actual, parsed.hash);
}

export function validPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function digest(password, nonce, passes, memory) {
  return argon2Async('argon2id', {
    message: password,
    nonce,
    parallelism: PARALLELISM,
    tagLength: TAG_LENGTH,
    memory,
    passes,
  });
}

function parseStored(stored) {
  if (typeof stored !== 'string') return null;
  const [algorithm, passes, memory, nonce, hash] = stored.split('$');
  if (algorithm !== 'argon2id' || !passes || !memory || !nonce || !hash) return null;
  try {
    return {
      passes: Number(passes),
      memory: Number(memory),
      nonce: Buffer.from(nonce, 'base64url'),
      hash: Buffer.from(hash, 'base64url'),
    };
  } catch {
    return null;
  }
}
