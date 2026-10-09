/**
 * Splits a legal document's plain text into blocks (pure, tested):
 *   "## Heading"        -> { type: 'heading', text }
 *   "- item" lines       -> { type: 'list', items }  (consecutive lines join)
 *   anything else        -> { type: 'paragraph', text } (lines join with a space
 *                           until a blank line)
 */
export function legalBlocks(body) {
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };

  for (const raw of String(body ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
    } else if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: line.slice(3).trim() });
    } else if (/^[-*] /.test(line)) {
      flushParagraph();
      if (!list) list = { type: 'list', items: [] };
      list.items.push(line.slice(2).trim());
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export default legalBlocks;
