import { useId, useState } from 'react';

/** Label + control + optional error, laid out consistently. */
export function Field({ label, error, wide, children }) {
  const id = useId();
  return (
    <div className={`field${wide ? ' field--wide' : ''}${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error ? <p className="field__error">{error}</p> : null}
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder, error, wide, type = 'text', disabled }) {
  return (
    <Field label={label} error={error} wide={wide}>
      {(id) => (
        <input
          id={id}
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 3, error }) {
  return (
    <Field label={label} error={error} wide>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function Checkbox({ label, checked, onChange }) {
  const id = useId();
  return (
    <div className="field field--checkbox">
      <input id={id} type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

/** One list entry per line. Blank lines are kept while typing and dropped at render time. */
export function LinesInput({ label, value, onChange, error }) {
  const lines = value ?? [];
  return (
    <TextArea
      label={label}
      rows={Math.min(Math.max(lines.length + 1, 3), 10)}
      value={lines.join('\n')}
      onChange={(text) => onChange(text.split('\n'))}
      error={error}
    />
  );
}

/** Comma-separated tags. Keeps the raw text locally so spaces and commas type naturally. */
export function TagsInput({ label, value, onChange, error }) {
  const joined = (value ?? []).join(', ');
  const [text, setText] = useState(joined);
  const [lastJoined, setLastJoined] = useState(joined);
  if (joined !== lastJoined) {
    setLastJoined(joined);
    if (parseTags(text).join(', ') !== joined) setText(joined);
  }
  return (
    <TextInput
      label={label}
      value={text}
      wide
      error={error}
      onChange={(next) => {
        setText(next);
        onChange(parseTags(next));
      }}
    />
  );
}

function parseTags(text) {
  return text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
