import { beforeAll, describe, expect, it } from 'vitest';

import { processMarkdown } from '../process-markdown';

describe('rehypeMermaidCodeBlock', () => {
  beforeAll(async () => {
    // Warm up Shiki highlighter (WASM init can be slow in CI)
    await processMarkdown('warm');
  }, 30_000);

  it('should replace mermaid code block with data-mermaid container', async () => {
    const md = '```mermaid\nflowchart TB\n  A-->B\n```';
    const html = await processMarkdown(md);

    expect(html).toContain('data-mermaid');
    expect(html).toContain('mermaid-container');
    expect(html).toContain('mermaid-source');
    // Should NOT have Shiki highlighting
    expect(html).not.toContain('class="shiki');
  });

  it('should preserve non-mermaid code blocks for Shiki', async () => {
    const md = '```javascript\nconst x = 1;\n```';
    const html = await processMarkdown(md);

    expect(html).not.toContain('data-mermaid');
    expect(html).toContain('class="shiki');
  });

  it('should handle mixed mermaid and code blocks', async () => {
    const md = [
      '```javascript',
      'const x = 1;',
      '```',
      '',
      '```mermaid',
      'flowchart TB',
      '  A-->B',
      '```',
    ].join('\n');
    const html = await processMarkdown(md);

    expect(html).toContain('class="shiki');
    expect(html).toContain('data-mermaid');
  });

  it('should keep mermaid source text as fallback', async () => {
    const md = '```mermaid\nflowchart LR\n  X-->Y\n```';
    const html = await processMarkdown(md);

    expect(html).toContain('flowchart LR');
    expect(html).toContain('X-->Y');
  });

  it('should work with anchorLinks disabled', async () => {
    const md = '## Heading\n\n```mermaid\nflowchart TB\n  A-->B\n```';
    const html = await processMarkdown(md, { anchorLinks: false });

    expect(html).toContain('data-mermaid');
    expect(html).not.toContain('class="anchor-link"');
  });
});
