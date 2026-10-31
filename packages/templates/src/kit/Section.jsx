/**
 * Wraps one section. Carries the section id so the editor can attach controls
 * to it later; templates never need to know about editing.
 *
 * @param {{ id: string, type: string, title?: string, className?: string, children: any }} props
 */
export function Section({ id, type, title, className = '', children }) {
  return (
    <section className={`cv-section cv-section--${type} ${className}`} data-section-id={id}>
      {title ? <h2 className="cv-section__title cv-flow">{title}</h2> : null}
      <div className="cv-section__body">{children}</div>
    </section>
  );
}

/** @param {{ id: string, as?: string, className?: string, children: any }} props */
export function Item({ id, as = 'div', className = '', children }) {
  const Tag = as;
  return (
    <Tag className={`cv-item ${className}`} data-item-id={id}>
      {children}
    </Tag>
  );
}
