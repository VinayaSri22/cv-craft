import { displayUrl, formatDate, formatDateRange, groupByCategory } from '@cv-craft/shared';
import { Entry, Item, Page, Photo, Section, TextLink, contactEntries, renderSection } from '../kit/index.js';
import css from './classic.css?inline';

const range = (item) => formatDateRange(item);

const renderers = {
  experience: ({ section }) => (
    <Section id={section.id} type={section.type} title={section.title}>
      {section.items.map((item) => (
        <Entry
          key={item.id}
          id={item.id}
          title={item.role}
          date={range(item)}
          subtitle={item.organization}
          location={item.location}
          bullets={item.bullets}
        />
      ))}
    </Section>
  ),

  education: ({ section }) => (
    <Section id={section.id} type={section.type} title={section.title}>
      {section.items.map((item) => (
        <Entry
          key={item.id}
          id={item.id}
          title={item.institution}
          date={range(item)}
          subtitle={[[item.degree, item.field].filter(Boolean).join(', '), item.grade]
            .filter(Boolean)
            .join(' · ')}
          location={item.location}
          bullets={item.bullets}
        />
      ))}
    </Section>
  ),

  projects: ({ section }) => (
    <Section id={section.id} type={section.type} title={section.title}>
      {section.items.map((item) => (
        <Entry
          key={item.id}
          id={item.id}
          title={[item.name, item.role].filter(Boolean).join(' — ')}
          date={range(item)}
          subtitle={item.url ? <TextLink href={item.url}>{displayUrl(item.url)}</TextLink> : ''}
          description={item.description}
          tags={item.technologies}
          bullets={item.bullets}
        />
      ))}
    </Section>
  ),

  skills: ({ section }) => (
    <Section id={section.id} type={section.type} title={section.title}>
      {groupByCategory(section.items, '').map((group) => (
        <div key={group.category || '_'} className="classic-skills__row cv-flow">
          {group.category ? <strong>{group.category}: </strong> : null}
          {group.items.map((item, i) => (
            <Item key={item.id} id={item.id} as="span" className="classic-skills__item">
              {item.name}
              {item.level ? ` (${item.level})` : ''}
              {i < group.items.length - 1 ? ', ' : ''}
            </Item>
          ))}
        </div>
      ))}
    </Section>
  ),

  certifications: ({ section }) => (
    <Section id={section.id} type={section.type} title={section.title}>
      {section.items.map((item) => (
        <Entry
          key={item.id}
          id={item.id}
          title={item.name}
          date={formatDate(item.date)}
          subtitle={[item.issuer, item.credentialId && `ID ${item.credentialId}`]
            .filter(Boolean)
            .join(' · ')}
        />
      ))}
    </Section>
  ),

  achievements: ({ section }) => (
    <Section id={section.id} type={section.type} title={section.title}>
      {section.items.map((item) => (
        <Entry
          key={item.id}
          id={item.id}
          title={item.title}
          date={formatDate(item.date)}
          subtitle={item.issuer}
          description={item.description}
        />
      ))}
    </Section>
  ),
};

/** @param {{ model: object, options: object }} props */
export function ClassicResume({ model, options }) {
  const { basics, summary, sections } = model;
  const contact = contactEntries(basics);
  const photoBesideName = Boolean(options.showPhoto && basics.photo?.id);

  return (
    <Page
      className={`tpl-classic tpl-classic--${options.density}`}
      css={css}
      options={options}
      style={{ '--accent': options.accent }}
    >
      <header className={`classic-header cv-flow${photoBesideName ? ' classic-header--side' : ''}`}>
        <Photo photo={basics.photo} show={options.showPhoto} className="classic-photo" />
        <div className="classic-header__main">
          {basics.fullName ? <h1 className="classic-header__name">{basics.fullName}</h1> : null}
          {basics.headline ? <p className="classic-header__headline">{basics.headline}</p> : null}
          {contact.length ? (
            <p className="classic-header__contact">
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
          <p className="classic-summary cv-flow">{summary}</p>
        </Section>
      ) : null}

      {sections.map((section) => renderSection(section, renderers))}
    </Page>
  );
}
