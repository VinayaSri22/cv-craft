import { SECTION_TYPES } from '@cv-craft/shared';
import { Checkbox, LinesInput, TagsInput, TextArea, TextInput } from './fields.jsx';

function errorFor(schema, value) {
  const result = schema?.safeParse(value);
  return result && !result.success ? result.error.issues[0]?.message : undefined;
}

/**
 * Renders the form for one item from the section type's field specs, so new
 * section types get a form without new editor code.
 */
export function ItemFields({ type, item, onChange }) {
  const spec = SECTION_TYPES[type];
  const shape = spec.itemSchema.shape;

  return (
    <div className="field-grid">
      {spec.fields.map((field) => {
        const value = item[field.key];
        const set = (next) => onChange({ [field.key]: next });
        const error = errorFor(shape[field.key], value);
        const common = { label: field.label, value, onChange: set, error };

        switch (field.kind) {
          case 'textarea':
            return <TextArea key={field.key} {...common} />;
          case 'checkbox':
            return <Checkbox key={field.key} label={field.label} checked={value} onChange={set} />;
          case 'lines':
            return <LinesInput key={field.key} {...common} />;
          case 'tags':
            return <TagsInput key={field.key} {...common} />;
          case 'date':
            return (
              <TextInput
                key={field.key}
                {...common}
                placeholder="YYYY-MM"
                disabled={field.key === 'endDate' && item.current}
              />
            );
          default:
            return <TextInput key={field.key} {...common} placeholder={field.placeholder} />;
        }
      })}
    </div>
  );
}
