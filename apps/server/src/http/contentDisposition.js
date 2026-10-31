/**
 * Builds an attachment header with an ASCII fallback name and an RFC 5987
 * UTF-8 name, so non-Latin names survive in browsers that support it.
 *
 * attachmentHeader('Ananya Rao Resume') →
 *   attachment; filename="Ananya-Rao-Resume.pdf"; filename*=UTF-8''Ananya-Rao-Resume.pdf
 *
 * @param {string} baseName
 */
const UNSAFE_FILENAME = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|']);

function sanitize(char) {
  return char.charCodeAt(0) < 32 || UNSAFE_FILENAME.has(char) ? ' ' : char;
}

function isPrintableAscii(char) {
  const code = char.charCodeAt(0);
  return code >= 33 && code <= 126;
}

export function attachmentHeader(baseName) {
  const words = [...baseName]
    .map(sanitize)
    .join('')
    .split(/\s+/)
    .filter((word) => word && !/^-+$/.test(word));
  const asciiWords = words
    .map((word) => [...word.normalize('NFKD')].filter(isPrintableAscii).join(''))
    .filter(Boolean);

  const unicodeName = `${words.join('-') || 'Resume'}.pdf`;
  const asciiName = `${asciiWords.join('-') || 'Resume'}.pdf`;
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(unicodeName)}`;
}
