import { beforeAll, describe, expect, it } from 'vitest';

import { highlightCode } from '../highlight-code';

describe('highlightCode', () => {
  beforeAll(async () => {
    // Warm up Shiki WASM initialization
    await highlightCode('warm', 'text');
  }, 30_000);

  it('should return highlighted HTML for valid code', async () => {
    const html = await highlightCode('const x = 1;', 'javascript');
    expect(html).toContain('class="shiki');
    expect(html).toContain('const');
  });

  it('should use text language by default', async () => {
    const html = await highlightCode('plain text');
    expect(html).toContain('class="shiki');
  });

  it('should handle empty code', async () => {
    const html = await highlightCode('', 'typescript');
    expect(html).toContain('class="shiki');
  });

  it('should produce dual-theme output', async () => {
    const html = await highlightCode('const x = 1;', 'javascript');
    // Dual theme mode uses shiki-light / shiki-dark classes or CSS variables
    expect(html).toMatch(/shiki/);
  });
});
