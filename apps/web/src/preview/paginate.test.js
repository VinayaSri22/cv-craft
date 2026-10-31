import { describe, expect, it } from 'vitest';
import { packBlocks, parseMargin } from './paginate.js';

const block = (height, gapFromPrev = 0, keepWithNext = false) => ({ height, gapFromPrev, keepWithNext });

describe('packBlocks', () => {
  it('keeps content on one page when it fits', () => {
    const pages = packBlocks([block(40), block(40, 10)], 100);
    expect(pages).toEqual([
      [
        { index: 0, gap: 0 },
        { index: 1, gap: 10 },
      ],
    ]);
  });

  it('starts a new page once the content box is full, and drops the leading gap', () => {
    const pages = packBlocks([block(60), block(50, 12)], 100);
    expect(pages).toEqual([[{ index: 0, gap: 0 }], [{ index: 1, gap: 0 }]]);
  });

  it('moves a heading onto the next page together with the entry after it', () => {
    const pages = packBlocks([block(70), block(20, 8, true), block(30, 6)], 100);
    expect(pages.map((page) => page.map((item) => item.index))).toEqual([[0], [1, 2]]);
  });

  it('returns one empty page when there is nothing to place', () => {
    expect(packBlocks([], 100)).toEqual([[]]);
  });
});

describe('parseMargin', () => {
  it('expands the two-value shorthand used by the templates', () => {
    expect(parseMargin('14mm 16mm')).toEqual({
      top: '14mm',
      right: '16mm',
      bottom: '14mm',
      left: '16mm',
    });
  });
});
