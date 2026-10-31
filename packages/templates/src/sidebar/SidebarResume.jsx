import { displayUrl } from '@cv-craft/shared';
import { Page, Section, renderSection } from '../kit/index.js';
import { standardRenderers } from '../kit/standardSections.jsx';
import css from './sidebar.css?inline';

const RAIL_TYPES = new Set(['skills', 'education', 'certifications']);
const renderers = standardRenderers('sidebar');

function contactLines(basics) {
  return [
    basics.email,
    basics.phone,
    basics.location,
    ...basics.links.filter((link) => link.url).map((link) => displayUrl(link.url)),
  ].filter(Boolean);
}

/** @param {{ model: object, options: object }} props */
export function SidebarResume({ model, options }) {
  const { basics, summary, sections } = model;
  const rail = sections.filter((section) => RAIL_TYPES.has(section.type));
  const main = sections.filter((section) => !RAIL_TYPES.has(section.type));
  const contact = contactLines(basics);

  return (
    <Page
      className={`tpl-sidebar tpl-sidebar--${options.density}`}
      css={css}
      options={options}
      style={{ '--accent': options.accent }}
    >
      <div className="sidebar-layout">
        <aside className="sidebar-rail">
          <header className="sidebar-identity">
            {basics.fullName ? <h1 className="sidebar-identity__name">{basics.fullName}</h1> : null}
            {basics.headline ? <p className="sidebar-identity__headline">{basics.headline}</p> : null}
          </header>
          {contact.length ? (
            <ul className="sidebar-contact">
              {contact.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          ) : null}
          {rail.map((section) => renderSection(section, renderers))}
        </aside>

        <div className="sidebar-main">
          {summary ? (
            <Section id="summary" type="summary" title="Summary">
              <p className="sidebar-summary">{summary}</p>
            </Section>
          ) : null}
          {main.map((section) => renderSection(section, renderers))}
        </div>
      </div>
    </Page>
  );
}
