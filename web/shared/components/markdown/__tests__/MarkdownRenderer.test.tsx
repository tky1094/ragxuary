import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { processMarkdown } from '@/shared/lib/markdown/process-markdown';

import { MarkdownRenderer } from '../MarkdownRenderer';

// Helper to render an async Server Component in tests
async function renderRSC(props: Parameters<typeof MarkdownRenderer>[0]) {
  const element = await MarkdownRenderer(props);
  return render(element);
}

describe('processMarkdown', () => {
  beforeAll(async () => {
    // Warm up Shiki highlighter (WASM init can be slow in CI)
    await processMarkdown('warm');
  }, 30_000);

  it('should render basic markdown text', async () => {
    const html = await processMarkdown('Hello **world**');
    expect(html).toContain('<strong>world</strong>');
  });

  it('should render headings with IDs', async () => {
    const html = await processMarkdown('## My Heading');
    expect(html).toContain('id="my-heading"');
    expect(html).toContain('My Heading');
  });

  it('should render anchor link before heading text', async () => {
    const html = await processMarkdown('## My Heading');
    expect(html).toContain('class="anchor-link"');
    expect(html).toContain('href="#my-heading"');
    // Anchor should appear before heading text (prepend behavior)
    const anchorPos = html.indexOf('anchor-link');
    const textPos = html.indexOf('My Heading');
    expect(anchorPos).toBeLessThan(textPos);
  });

  it('should render GFM tables', async () => {
    const html = await processMarkdown('| A | B |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<td>2</td>');
  });

  it('should render GFM task lists', async () => {
    const html = await processMarkdown('- [x] Done\n- [ ] Todo');
    expect(html).toContain('checked');
    expect(html).toContain('type="checkbox"');
  });

  it('should render code blocks with syntax highlighting', async () => {
    const html = await processMarkdown('```javascript\nconst x = 1;\n```');
    // Shiki wraps code in <pre class="shiki ..."><code>
    expect(html).toContain('class="shiki');
    expect(html).toContain('language-javascript');
    expect(html).toContain('const');
  });

  it('should render empty content without errors', async () => {
    const html = await processMarkdown('');
    expect(html).toBe('');
  });
});

describe('MarkdownRenderer', () => {
  it('should apply prose classes by default', async () => {
    const { container } = await renderRSC({ content: 'test' });
    expect(container.firstChild).toHaveClass('prose');
  });

  it('should apply custom className', async () => {
    const { container } = await renderRSC({
      content: 'test',
      className: 'custom-class',
    });
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.firstChild).toHaveClass('prose');
  });

  it('should render HTML from processMarkdown', async () => {
    const { container } = await renderRSC({
      content: 'Hello **world**',
    });
    expect(container.querySelector('strong')?.textContent).toBe('world');
  });
});
