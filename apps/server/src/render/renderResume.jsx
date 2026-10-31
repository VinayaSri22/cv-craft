import { renderToStaticMarkup } from 'react-dom/server';
import { compose } from '@cv-craft/shared';
import { getTemplate, resolveOptions } from '@cv-craft/templates';

/**
 * Renders a resume to a standalone HTML document for printing. Uses the same
 * compose() and template component as the browser preview, so the PDF matches
 * what the user sees.
 *
 * @param {object} profile  A validated profile.
 * @param {object} settings Validated resume settings.
 * @returns {{ html: string, title: string }}
 */
export function renderResume(profile, settings) {
  const template = getTemplate(settings.templateId);
  const options = resolveOptions(template, settings.options);
  const model = compose(profile, settings);
  const body = renderToStaticMarkup(<template.Component model={model} options={options} />);
  const title = [model.basics.fullName.trim(), 'Resume'].filter(Boolean).join(' ');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>html, body { margin: 0; padding: 0; background: #fff; }</style>
</head>
<body>${body}</body>
</html>`;

  return { html, title };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
