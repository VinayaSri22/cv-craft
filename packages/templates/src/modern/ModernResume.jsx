import { displayUrl } from '@cv-craft/shared';
import { Page, Photo, Section, renderSection } from '../kit/index.js';
import { standardRenderers } from '../kit/standardSections.jsx';
import css from './modern.css?inline';

const renderers = standardRenderers('modern');

/** @param {{ model: object, options: object }} props */
export function ModernResume({ model, options }) {
  const { basics, summary, sections } = model;
  const contact = [
    basics.email,
    basics.phone,
    basics.location,
    ...basics.links.filter((link) => link.url).map((link) => displayUrl(link.url)),
  ].filter(Boolean);

  return (
    <Page
      className={`tpl-modern tpl-modern--${options.density}`}
      css={css}
      options={options}
      style={{ '--accent': options.accent }}
    >
      <header className="modern-header cv-flow">
        <Photo photo={basics.photo} show={options.showPhoto} className="modern-photo" />
        <div className="modern-header__text">
          {basics.fullName ? <h1 className="modern-header__name">{basics.fullName}</h1> : null}
          {basics.headline ? <p className="modern-header__headline">{basics.headline}</p> : null}
          {contact.length ? (
            <p className="modern-header__contact">
              {contact.map((entry, index) => (
                <span key={index}>{entry}</span>
              ))}
            </p>
          ) : null}
        </div>
      </header>

      {summary ? (
        <Section id="summary" type="summary" title="Summary">
          <p className="modern-summary cv-flow">{summary}</p>
        </Section>
      ) : null}

      {sections.map((section) => renderSection(section, renderers))}
    </Page>
  );
}
