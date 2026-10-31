import { useMemo, useState } from 'react';
import { compose } from '@cv-craft/shared';
import { DEFAULT_PAGE_MARGIN, getTemplate, resolveOptions, templates } from '@cv-craft/templates';
import { useActions, useEditorStore } from '../store/useEditorStore.js';
import { PagedPreview } from './PagedPreview.jsx';

const ZOOM_LEVELS = [0.6, 0.75, 0.9, 1];

function OptionControl({ control, value, onChange }) {
  if (control.kind === 'color') {
    return (
      <label className="toolbar__field">
        <span>{control.label}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  return (
    <label className="toolbar__field">
      <span>{control.label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {control.choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PreviewPane() {
  const profile = useEditorStore((s) => s.profile);
  const settings = useEditorStore((s) => s.resume.settings);
  const { setTemplate, setOption } = useActions();
  const [zoom, setZoom] = useState(0.75);

  const template = getTemplate(settings.templateId);
  const options = useMemo(() => resolveOptions(template, settings.options), [template, settings.options]);
  const model = useMemo(() => compose(profile, settings), [profile, settings]);
  const isEmpty = !model.basics.fullName && !model.summary && model.sections.length === 0;
  const layoutKey = JSON.stringify({ templateId: template.id, options, model });

  return (
    <div className="preview">
      <div className="toolbar">
        <label className="toolbar__field">
          <span>Template</span>
          <select value={template.id} onChange={(e) => setTemplate(e.target.value)}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {template.optionControls.map((control) => (
          <OptionControl
            key={control.key}
            control={control}
            value={options[control.key]}
            onChange={(value) => setOption(control.key, value)}
          />
        ))}
        <label className="toolbar__field toolbar__field--end">
          <span>Zoom</span>
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
            {ZOOM_LEVELS.map((level) => (
              <option key={level} value={level}>
                {Math.round(level * 100)}%
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="preview__canvas">
        {isEmpty ? (
          <p className="preview__empty">
            Start filling in your details, or load the sample profile to see how templates work.
          </p>
        ) : null}
        <PagedPreview pageSize={options.pageSize} margin={DEFAULT_PAGE_MARGIN} zoom={zoom} layoutKey={layoutKey}>
          <template.Component model={model} options={options} />
        </PagedPreview>
      </div>
    </div>
  );
}
