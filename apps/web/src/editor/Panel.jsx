import { useState } from 'react';

/** Collapsible card used for each editor section. */
export function Panel({ title, actions, muted, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`panel${open ? ' panel--open' : ''}${muted ? ' panel--muted' : ''}`}>
      <header className="panel__header">
        <button
          type="button"
          className="panel__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="panel__chevron" aria-hidden>
            ▸
          </span>
          {title}
        </button>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </header>
      {open ? <div className="panel__body">{children}</div> : null}
    </section>
  );
}
