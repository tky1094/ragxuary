import { beforeAll, describe, expect, it } from 'vitest';

// In test environment, 'use server' is a no-op.
// We test the function directly as a regular async function.
import { highlightMarkdownAction } from '../actions';

describe('highlightMarkdownAction', () => {
  beforeAll(async () => {
    // Warm up Shiki WASM initialization
    await highlightMarkdownAction('warm');
  }, 30_000);

  it('should return highlighted HTML', async () => {
    const html = await highlightMarkdownAction('Hello **world**');
    expect(html).toContain('<strong>world</strong>');
  });

  it('should highlight code blocks', async () => {
    const html = await highlightMarkdownAction(
      '```javascript\nconst x = 1;\n```'
    );
    expect(html).toContain('class="shiki');
  });

  it('should include anchor links by default', async () => {
    const html = await highlightMarkdownAction('## My Heading');
    expect(html).toContain('id="my-heading"');
    expect(html).toContain('class="anchor-link"');
  });

  it('should omit anchor links when anchorLinks is false', async () => {
    const html = await highlightMarkdownAction('## My Heading', {
      anchorLinks: false,
    });
    expect(html).not.toContain('id="my-heading"');
    expect(html).not.toContain('class="anchor-link"');
    expect(html).toContain('My Heading');
  });
});
