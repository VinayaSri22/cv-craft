import { displayUrl } from '@cv-craft/shared';

const HTTP = /^https?:\/\//i;

/** Accepts http(s) and mailto. Anything else is shown as plain text. */
export function safeHref(value) {
  const raw = String(value ?? '').trim();
  if (!raw || /[\s<>"']/.test(raw)) return null;
  if (/^(javascript|data|vbscript):/i.test(raw)) return null;
  if (HTTP.test(raw)) return raw;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(raw)) return raw;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(raw)) return `https://${raw}`;
  return null;
}

function emailHref(email) {
  const value = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return `mailto:${value}`;
}

/** Name, contact, and profile links in the order templates print them. */
export function contactEntries(basics) {
  const entries = [];
  if (basics.email?.trim()) {
    entries.push({ key: 'email', text: basics.email.trim(), href: emailHref(basics.email) });
  }
  if (basics.phone?.trim()) entries.push({ key: 'phone', text: basics.phone.trim(), href: null });
  if (basics.location?.trim()) entries.push({ key: 'location', text: basics.location.trim(), href: null });
  for (const link of basics.links ?? []) {
    const url = link.url?.trim();
    if (!url) continue;
    const text = link.label?.trim() || displayUrl(url);
    if (!text) continue;
    entries.push({ key: link.id, text, href: url });
  }
  return entries;
}

/** Renders link text. An unsafe or missing address stays plain text. */
export function TextLink({ href, children }) {
  const url = safeHref(href);
  if (!url) return children;
  return <a href={url}>{children}</a>;
}
