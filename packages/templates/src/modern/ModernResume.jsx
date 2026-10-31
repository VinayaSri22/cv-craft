import { Page, Photo, Section, TextLink, contactEntries, renderSection } from '../kit/index.js';
import { standardRenderers } from '../kit/standardSections.jsx';
import css from './modern.css?inline';

const renderers = standardRenderers('modern');

/** @param {{ model: object, options: object }} props */
export function ModernResume({ model, options }) {
  const { basics, summary, sections } = model;
  const contact = contactEntries(basics);

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
            {contact.map((entry) => (
              <span key={entry.key}>
                <TextLink href={entry.href}>{entry.text}</TextLink>
              </span>
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
