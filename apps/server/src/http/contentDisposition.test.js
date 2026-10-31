import { describe, expect, it } from 'vitest';
import { attachmentHeader } from './contentDisposition.js';

describe('attachmentHeader', () => {
  it('hyphenates plain names', () => {
    expect(attachmentHeader('Ananya Rao Resume')).toBe(
      `attachment; filename="Ananya-Rao-Resume.pdf"; filename*=UTF-8''Ananya-Rao-Resume.pdf`,
    );
  });

  it('keeps accents in the UTF-8 name and strips them from the fallback', () => {
    const header = attachmentHeader('Zoë Ølsen Resume');
    expect(header).toContain('filename="Zoe-lsen-Resume.pdf"');
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent('Zoë-Ølsen-Resume.pdf')}`);
  });

  it('falls back to Resume.pdf for fully non-Latin names', () => {
    expect(attachmentHeader('山田')).toContain('filename="Resume.pdf"');
  });

  it('removes characters that are unsafe in headers or file systems', () => {
    const header = attachmentHeader('a"b/c\\d\r\nResume');
    expect(header).toContain('filename="a-b-c-d-Resume.pdf"');
    expect(header).not.toMatch(/[\r\n]/);
  });
});
