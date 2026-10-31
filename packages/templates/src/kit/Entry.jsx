import { Item } from './Section.jsx';

/**
 * The common resume entry: a title row with dates, a subtitle row with
 * location, then description and bullets. Every field is optional.
 *
 * @param {{
 *   id: string, title?: string, subtitle?: string, date?: string, location?: string,
 *   description?: string, bullets?: string[], tags?: string[], className?: string
 * }} props
 */
export function Entry({ id, title, subtitle, date, location, description, bullets, tags, className = '' }) {
  return (
    <Item id={id} className={`cv-entry cv-flow ${className}`}>
      {title || date ? (
        <div className="cv-entry__row cv-entry__row--primary">
          <h3 className="cv-entry__title">{title}</h3>
          {date ? <span className="cv-entry__date">{date}</span> : null}
        </div>
      ) : null}
      {subtitle || location ? (
        <div className="cv-entry__row cv-entry__row--secondary">
          <span className="cv-entry__subtitle">{subtitle}</span>
          {location ? <span className="cv-entry__location">{location}</span> : null}
        </div>
      ) : null}
      {description ? <p className="cv-entry__description">{description}</p> : null}
      {tags?.length ? <p className="cv-entry__tags">{tags.join(' · ')}</p> : null}
      {bullets?.length ? (
        <ul className="cv-entry__bullets">
          {bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </Item>
  );
}
