const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * @param {string} value YYYY, YYYY-MM, or YYYY-MM-DD
 * @param {{ month?: 'short'|'long'|'numeric'|'none' }} [opts]
 */
export function formatDate(value, { month = 'short' } = {}) {
  if (!value) return '';
  const [year, mm] = value.split('-');
  if (!mm || month === 'none') return year;
  const index = Number(mm) - 1;
  if (month === 'numeric') return `${mm}/${year}`;
  const names = month === 'long' ? MONTHS_LONG : MONTHS_SHORT;
  return `${names[index]} ${year}`;
}

/**
 * @param {{ startDate?: string, endDate?: string, current?: boolean }} item
 * @param {{ month?: 'short'|'long'|'numeric'|'none', separator?: string, presentLabel?: string }} [opts]
 */
export function formatDateRange(item, { separator = ' – ', presentLabel = 'Present', ...opts } = {}) {
  const start = formatDate(item.startDate, opts);
  const end = item.current ? presentLabel : formatDate(item.endDate, opts);
  if (start && end) return start === end ? start : `${start}${separator}${end}`;
  return start || end;
}

/** Strips the scheme and trailing slash for display: https://github.com/jane/ → github.com/jane */
export function displayUrl(url) {
  return (url ?? '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

/** Groups skills by category, preserving first-seen order of categories and items. */
export function groupByCategory(items, fallback = 'Other') {
  const groups = new Map();
  for (const item of items) {
    const key = item.category?.trim() || fallback;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups].map(([category, entries]) => ({ category, items: entries }));
}
