/**
 * Packs measured resume blocks into pages the same way print does: each page
 * has its own margins, and a section heading stays with the block after it.
 *
 * @param {{ height: number, gapFromPrev: number, keepWithNext?: boolean }[]} blocks
 * @param {number} contentHeight
 * @returns {{ index: number, gap: number }[][]}
 */
export function packBlocks(blocks, contentHeight) {
  /** @type {{ index: number, gap: number }[][]} */
  const pages = [];
  /** @type {{ index: number, gap: number }[]} */
  let page = [];
  let used = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = block.keepWithNext ? blocks[i + 1] : undefined;
    const nextNeed = next ? next.gapFromPrev + next.height : 0;
    const gap = page.length === 0 ? 0 : block.gapFromPrev;

    if (page.length > 0 && used + gap + block.height + nextNeed > contentHeight) {
      pages.push(page);
      page = [];
      used = 0;
    }

    const appliedGap = page.length === 0 ? 0 : block.gapFromPrev;
    page.push({ index: i, gap: appliedGap });
    used += appliedGap + block.height;
  }

  if (page.length > 0 || pages.length === 0) pages.push(page);
  return pages;
}

/** How many page windows fit a continuous layout of `contentPx` inside a box of `boxPx`. */
export function sliceCount(contentPx, boxPx) {
  if (boxPx <= 0) return 1;
  return Math.max(1, Math.ceil((contentPx - 1) / boxPx));
}

/** CSS margin shorthand (1 to 4 values) to top/right/bottom/left. */
export function parseMargin(margin) {
  const [top, right = top, bottom = top, left = right] = margin.trim().split(/\s+/);
  return { top, right, bottom, left };
}

/**
 * Reads flow blocks out of a rendered resume and splits them into pages.
 * Blocks are elements marked `.cv-flow` (headings, entries, skill rows).
 *
 * @param {HTMLElement} root The `.cv-page` element, laid out at content width with no padding.
 * @param {number} contentHeightPx Height available for content on one page.
 * @returns {{ html: string, gap: number }[][]}
 */
export function paginateElement(root, contentHeightPx) {
  const nodes = [...root.querySelectorAll('.cv-flow')].filter(
    (node) => !node.parentElement?.closest('.cv-flow'),
  );
  const blocks = nodes.map((node, index) => {
    const rect = node.getBoundingClientRect();
    const prev = nodes[index - 1]?.getBoundingClientRect();
    return {
      height: rect.height,
      gapFromPrev: prev ? Math.max(0, rect.top - prev.bottom) : 0,
      keepWithNext: node.classList.contains('cv-section__title'),
    };
  });

  return packBlocks(blocks, contentHeightPx).map((page) =>
    page.map(({ index, gap }) => ({ html: nodes[index].outerHTML, gap })),
  );
}
