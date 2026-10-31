import { displayUrl, formatDate, formatDateRange, groupByCategory } from '@cv-craft/shared';
import { Entry } from './Entry.jsx';
import { Item, Section } from './Section.jsx';

const range = (item) => formatDateRange(item);

/** Section renderers shared by templates that use the standard entry shape. */
export function standardRenderers(prefix) {
  return {
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
            subtitle={displayUrl(item.url)}
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
          <div key={group.category || '_'} className={`${prefix}-skills__row cv-flow`}>
            {group.category ? <strong>{group.category}: </strong> : null}
            {group.items.map((item, i) => (
              <Item key={item.id} id={item.id} as="span" className={`${prefix}-skills__item`}>
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
            subtitle={[item.issuer, item.credentialId && `ID ${item.credentialId}`].filter(Boolean).join(' · ')}
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
}
