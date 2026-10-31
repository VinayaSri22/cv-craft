import { describe, expect, it } from 'vitest';
import { displayUrl, formatDate, formatDateRange, groupByCategory } from './format.js';

describe('formatDate', () => {
  it.each([
    ['', {}, ''],
    ['2021', {}, '2021'],
    ['2021-04', {}, 'Apr 2021'],
    ['2021-04-15', { month: 'long' }, 'April 2021'],
    ['2021-04', { month: 'numeric' }, '04/2021'],
    ['2021-04', { month: 'none' }, '2021'],
  ])('%s %o → %s', (value, opts, expected) => {
    expect(formatDate(value, opts)).toBe(expected);
  });
});

describe('formatDateRange', () => {
  it('formats a closed range', () => {
    expect(formatDateRange({ startDate: '2017-07', endDate: '2021-03' })).toBe('Jul 2017 – Mar 2021');
  });

  it('uses Present for current roles regardless of end date', () => {
    expect(formatDateRange({ startDate: '2021-04', endDate: '2022-01', current: true })).toBe(
      'Apr 2021 – Present',
    );
  });

  it('returns whichever side exists', () => {
    expect(formatDateRange({ startDate: '', endDate: '2020' })).toBe('2020');
    expect(formatDateRange({ startDate: '2020', endDate: '' })).toBe('2020');
  });

  it('collapses identical start and end', () => {
    expect(formatDateRange({ startDate: '2020', endDate: '2020' })).toBe('2020');
  });
});

describe('displayUrl', () => {
  it('strips scheme, www, and trailing slash', () => {
    expect(displayUrl('https://www.linkedin.com/in/ananyarao/')).toBe('linkedin.com/in/ananyarao');
  });
});

describe('groupByCategory', () => {
  it('preserves first-seen order and uses a fallback category', () => {
    const groups = groupByCategory([
      { name: 'Go', category: 'Languages' },
      { name: 'Git', category: '' },
      { name: 'Java', category: 'Languages' },
    ]);
    expect(groups.map((g) => g.category)).toEqual(['Languages', 'Other']);
    expect(groups[0].items.map((i) => i.name)).toEqual(['Go', 'Java']);
  });
});
