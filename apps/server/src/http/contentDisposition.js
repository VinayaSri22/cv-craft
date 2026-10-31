/**
 * Builds an attachment header with an ASCII fallback name and an RFC 5987
 * UTF-8 name, so non-Latin names survive in browsers that support it.
 *
 * attachmentHeader('Ananya Rao Resume') →
 *   attachment; filename="Ananya-Rao-Resume.pdf"; filename*=UTF-8''Ananya-Rao-Resume.pdf
 *
 * @param {string} baseName
 */
export function attachmentHeader(baseName) {
  const words = baseName
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !/^-+$/.test(word));
  const asciiWords = words
    .map((word) => word.normalize('NFKD').replace(/[^\x21-\x7e]/g, ''))
    .filter(Boolean);

  const unicodeName = `${words.join('-') || 'Resume'}.pdf`;
  const asciiName = `${asciiWords.join('-') || 'Resume'}.pdf`;
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(unicodeName)}`;
}
