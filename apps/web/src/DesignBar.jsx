import { useMemo } from 'react';
import { getTemplate, resolveOptions, templates } from '@cv-craft/templates';
import { useConfirm } from './confirm/ConfirmDialog.jsx';
import { TransferButtons } from './TransferButtons.jsx';
import { useActions, useEditorStore } from './store/useEditorStore.js';

const ZOOM_LEVELS = [0.6, 0.75, 0.9, 1];

function OptionControl({ control, value, onChange }) {
  if (control.kind === 'color') {
    return (
      <label className="control">
        <span>{control.label}</span>
        <input type="color" value={value} aria-label={control.label} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (control.kind === 'checkbox') {
    return (
      <label className="switch">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch__track" aria-hidden="true" />
        <span>{control.label}</span>
      </label>
    );
  }
  return (
    <label className="control">
      <span>{control.label}</span>
      <select value={value} aria-label={control.label} onChange={(e) => onChange(e.target.value)}>
        {control.choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DesignBar({ zoom, onZoom }) {
  const settings = useEditorStore((s) => s.resume.settings);
  const { setTemplate, setOption, loadSample, reset } = useActions();
  const confirm = useConfirm();
  const template = getTemplate(settings.templateId);
  const options = useMemo(() => resolveOptions(template, settings.options), [template, settings.options]);

  const confirmThen = (dialog, action) => async () => {
    if (await confirm(dialog)) action();
  };

  return (
    <div className="designbar">
      <div className="designbar__group">
        <label className="control">
          <span>Template</span>
          <select value={template.id} aria-label="Template" onChange={(e) => setTemplate(e.target.value)}>
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
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
      </div>

      <div className="designbar__group designbar__group--end">
        <button
          type="button"
          className="quiet"
          onClick={confirmThen(
            {
              title: 'Load sample profile',
              message: 'This replaces your current details with the sample profile.',
              confirmLabel: 'Load sample',
            },
            loadSample,
          )}
        >
          Load sample
        </button>
        <button
          type="button"
          className="quiet quiet--danger"
          onClick={confirmThen(
            {
              title: 'Start over',
              message: 'This permanently clears all of your details.',
              confirmLabel: 'Clear data',
              danger: true,
            },
            reset,
          )}
        >
          Start over
        </button>
        <span className="designbar__rule" aria-hidden="true" />
        <TransferButtons />
        <span className="designbar__rule" aria-hidden="true" />
        <label className="control">
          <span>Zoom</span>
          <select value={zoom} aria-label="Zoom" onChange={(e) => onZoom(Number(e.target.value))}>
            {ZOOM_LEVELS.map((level) => (
              <option key={level} value={level}>
                {Math.round(level * 100)}%
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
