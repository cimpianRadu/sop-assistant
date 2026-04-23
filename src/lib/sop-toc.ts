export type TocItem = {
  level: 1 | 2 | 3;
  text: string;
  id: string;
};

/**
 * Extract H1/H2/H3 headings from a markdown string into a TOC list.
 * The generated `id` must match MarkdownRenderer's slugify output.
 */
export function sopToHeadings(markdown: string): TocItem[] {
  const out: TocItem[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length as 1 | 2 | 3;
    const text = m[2].trim();
    const id = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    out.push({ level, text, id });
  }
  return out;
}
