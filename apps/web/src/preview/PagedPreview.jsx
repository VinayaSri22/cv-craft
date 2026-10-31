import { useLayoutEffect, useRef, useState } from 'react';
import { DEFAULT_PAGE_MARGIN, PAGE_SIZES } from '@cv-craft/templates';
import { paginateElement, parseMargin } from './paginate.js';

function lengthToPx(length) {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.height = length;
  document.body.append(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}

/**
 * Shows the resume as separate paper sheets. The on-screen sheets use the same
 * page size and margins as the PDF, so a second page shows up here whenever
 * the download will have one.
 */
export function PagedPreview({ pageSize = 'A4', margin = DEFAULT_PAGE_MARGIN, zoom = 1, layoutKey, children }) {
  const measureRef = useRef(null);
  const [frame, setFrame] = useState({
    sheets: /** @type {{ html: string, gap: number }[][]} */ ([]),
    style: /** @type {Record<string, string>} */ ({}),
    templateClass: '',
  });
  const box = PAGE_SIZES[pageSize] ?? PAGE_SIZES.A4;
  const edges = parseMargin(margin);

  useLayoutEffect(() => {
    const measure = () => {
      const root = measureRef.current?.querySelector('.cv-page');
      if (!root) return;
      const contentHeight = lengthToPx(box.height) - lengthToPx(edges.top) - lengthToPx(edges.bottom);
      /** @type {Record<string, string>} */
      const style = {};
      for (const name of root.style) style[name] = root.style.getPropertyValue(name);
      setFrame({
        sheets: paginateElement(root, contentHeight),
        style,
        templateClass: root.className.replace(/\bcv-page\b/, '').trim(),
      });
    };

    measure();
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [layoutKey, box.height, edges.top, edges.bottom]);

  const { sheets, style, templateClass } = frame;

  return (
    <div className="paged">
      <div
        className="preview-measure"
        ref={measureRef}
        style={{ width: `calc(${box.width} - ${edges.left} - ${edges.right})` }}
      >
        {children}
      </div>

      <div className="preview-sheets" style={{ zoom }}>
        {(sheets.length > 0 ? sheets : [[]]).map((page, index, all) => (
          <figure className="preview-sheet-wrap" key={index}>
            <div
              className={`preview-sheet cv-page ${templateClass}`}
              style={{ ...style, width: box.width, height: box.height, padding: margin }}
            >
              {page.map((block, blockIndex) => (
                <div key={blockIndex} className="preview-block" style={{ marginTop: block.gap }}>
                  <div dangerouslySetInnerHTML={{ __html: block.html }} />
                </div>
              ))}
            </div>
            <figcaption className="preview-sheet__label">
              Page {index + 1} of {all.length}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
