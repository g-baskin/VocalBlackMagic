export interface DesignDiagram {
  /** The nearest `##` heading above the diagram. */
  title: string;
  /** Plain prose between that heading and the diagram, if any. */
  intro: string;
  /** Plain prose after the diagram, up to the next heading or diagram. */
  outro: string;
  /** The Mermaid source inside the fenced block. */
  source: string;
}

const FENCE = /^```mermaid\s*$/;

function prose(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1');
}

/** Pull every ```mermaid block out of a markdown document, with its heading and nearby prose. */
export function extractMermaidDiagrams(markdown: string): DesignDiagram[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const diagrams: DesignDiagram[] = [];
  let title = '';
  let pending: string[] = [];
  let last: DesignDiagram | null = null;
  let afterLast: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^#{2,3}\s+(.*)$/.exec(line);
    if (heading) {
      if (last) last.outro = prose(afterLast);
      last = null;
      afterLast = [];
      title = heading[1].trim();
      pending = [];
      continue;
    }
    if (FENCE.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      if (last) last.outro = prose(afterLast);
      last = { title, intro: prose(pending), outro: '', source: body.join('\n').trim() };
      diagrams.push(last);
      pending = [];
      afterLast = [];
      continue;
    }
    if (last) afterLast.push(line);
    else pending.push(line);
  }
  if (last) last.outro = prose(afterLast);
  return diagrams.filter((d) => d.source.length > 0);
}
