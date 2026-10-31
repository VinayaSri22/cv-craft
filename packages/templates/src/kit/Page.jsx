import pageCss from './page.css?inline';

/** Shared by the preview and the PDF so both paginate to the same page box. */
export const PAGE_SIZES = {
  A4: { width: '210mm', height: '297mm' },
  Letter: { width: '8.5in', height: '11in' },
};

export const DEFAULT_PAGE_MARGIN = '14mm 16mm';

/**
 * Root of every template. Owns page size, print margins, and style injection,
 * so templates only describe layout.
 *
 * @param {{ className: string, css: string, options: { pageSize?: string, margin?: string }, style?: object, children: any }} props
 */
export function Page({ className, css, options, style, children }) {
  const size = PAGE_SIZES[options.pageSize] ? options.pageSize : 'A4';
  const box = PAGE_SIZES[size];
  const margin = options.margin ?? DEFAULT_PAGE_MARGIN;
  return (
    <article
      className={`cv-page ${className}`}
      data-page-size={size}
      style={{ width: box.width, minHeight: box.height, '--cv-page-margin': margin, ...style }}
    >
      <style>{`${pageCss}\n@page { size: ${size}; margin: ${margin}; }\n${css}`}</style>
      {children}
    </article>
  );
}
