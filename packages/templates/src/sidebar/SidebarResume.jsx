import { Page, Photo, Section, TextLink, contactEntries, renderSection } from '../kit/index.js';
import { standardRenderers } from '../kit/standardSections.jsx';
import css from './sidebar.css?inline';

const RAIL_TYPES = new Set(['skills', 'education', 'certifications']);
const renderers = standardRenderers('sidebar');

/** @param {{ model: object, options: object }} props */
export function SidebarResume({ model, options }) {
  const { basics, summary, sections } = model;
  const rail = sections.filter((section) => RAIL_TYPES.has(section.type));
  const main = sections.filter((section) => !RAIL_TYPES.has(section.type));
  const contact = contactEntries(basics);

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
            <Photo photo={basics.photo} show={options.showPhoto} className="sidebar-photo" />
            {basics.fullName ? <h1 className="sidebar-identity__name">{basics.fullName}</h1> : null}
            {basics.headline ? <p className="sidebar-identity__headline">{basics.headline}</p> : null}
          </header>
          {contact.length ? (
            <ul className="sidebar-contact">
              {contact.map((entry) => (
                <li key={entry.key}>
                  <TextLink href={entry.href}>{entry.text}</TextLink>
                </li>
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
