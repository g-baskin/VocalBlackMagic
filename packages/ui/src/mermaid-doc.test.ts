import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { extractMermaidDiagrams } from './mermaid-doc';

describe('extractMermaidDiagrams', () => {
  test('pairs each block with its heading and prose', () => {
    const md = [
      '# Doc',
      '## First',
      'Intro with a [link](x.md) and `code`.',
      '```mermaid',
      'flowchart LR',
      '  a --> b',
      '```',
      'After the first.',
      '## Second',
      '```mermaid',
      'stateDiagram-v2',
      '  [*] --> x',
      '```'
    ].join('\n');
    const d = extractMermaidDiagrams(md);
    expect(d).toHaveLength(2);
    expect(d[0]).toEqual({
      title: 'First',
      intro: 'Intro with a link and code.',
      outro: 'After the first.',
      source: 'flowchart LR\n  a --> b'
    });
    expect(d[1].title).toBe('Second');
    expect(d[1].intro).toBe('');
    expect(d[1].source.startsWith('stateDiagram-v2')).toBe(true);
  });

  test('ignores other fenced blocks and empty diagrams', () => {
    const md = '## A\n```ts\nconst x = 1;\n```\n```mermaid\n```\n';
    expect(extractMermaidDiagrams(md)).toHaveLength(0);
  });

  test('the repository design doc has its diagrams', () => {
    const md = readFileSync(new URL('../../../docs/DESIGN.md', import.meta.url), 'utf8');
    const d = extractMermaidDiagrams(md);
    expect(d.length).toBeGreaterThanOrEqual(8);
    for (const diagram of d) {
      expect(diagram.title.length).toBeGreaterThan(0);
      expect(diagram.source).toMatch(/^(flowchart|sequenceDiagram|stateDiagram-v2)/);
    }
  });
});
