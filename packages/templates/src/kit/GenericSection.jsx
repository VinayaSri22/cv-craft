import { formatDate, formatDateRange } from '@cv-craft/shared';
import { Entry } from './Entry.jsx';
import { Section } from './Section.jsx';

const first = (item, keys) => keys.map((key) => item[key]).find((v) => typeof v === 'string' && v);

/**
 * Maps any item onto the common entry shape. Used for `custom` sections and
 * for any section type a template has no dedicated renderer for, so content is
 * never dropped.
 */
export function toEntryProps(item) {
  const range = formatDateRange(item);
  return {
    id: item.id,
    title: first(item, ['heading', 'title', 'name', 'role', 'degree']),
    subtitle: first(item, ['subheading', 'organization', 'institution', 'issuer', 'category']),
    date: range || formatDate(item.date ?? ''),
    location: item.location,
    description: item.description,
    bullets: item.bullets,
    tags: item.technologies,
  };
}

/** @param {{ section: object, className?: string }} props */
export function GenericSection({ section, className }) {
  return (
    <Section id={section.id} type={section.type} title={section.title} className={className}>
      {section.items.map((item) => (
        <Entry key={item.id} {...toEntryProps(item)} />
      ))}
    </Section>
  );
}

/**
 * Picks the template's renderer for a section, falling back to GenericSection.
 * @param {object} section
 * @param {Record<string, (props: { section: object }) => any>} renderers
 */
export function renderSection(section, renderers) {
  const Renderer = renderers[section.type] ?? GenericSection;
  return <Renderer key={section.id} section={section} />;
}
