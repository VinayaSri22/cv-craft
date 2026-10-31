import { useMemo } from 'react';
import { compose } from '@cv-craft/shared';
import { DEFAULT_PAGE_MARGIN, getTemplate, resolveOptions } from '@cv-craft/templates';
import { useEditorStore } from '../store/useEditorStore.js';
import { PagedPreview } from './PagedPreview.jsx';

export function PreviewPane({ zoom }) {
  const profile = useEditorStore((s) => s.profile);
  const settings = useEditorStore((s) => s.resume.settings);
  const template = getTemplate(settings.templateId);
  const options = useMemo(() => resolveOptions(template, settings.options), [template, settings.options]);
  const model = useMemo(() => compose(profile, settings), [profile, settings]);
  const isEmpty = !model.basics.fullName && !model.summary && model.sections.length === 0;
  const layoutKey = JSON.stringify({ templateId: template.id, options, model });

  return (
    <div className="preview">
      <div className="preview__canvas">
        {isEmpty ? (
          <p className="preview__empty">
            Start filling in your details, or load the sample profile to see how templates work.
          </p>
        ) : null}
        <PagedPreview
          pageSize={options.pageSize}
          margin={DEFAULT_PAGE_MARGIN}
          zoom={zoom}
          layoutKey={layoutKey}
          previewMode={template.previewMode}
        >
          <template.Component model={model} options={options} />
        </PagedPreview>
      </div>
    </div>
  );
}
