import { describe, expect, it } from 'vitest';

import { highlightCode } from '../highlight-code';
import { getEditorTransformers } from '../transformers';

describe('getEditorTransformers', () => {
  it('returns an array of transformers', () => {
    const transformers = getEditorTransformers();
    expect(Array.isArray(transformers)).toBe(true);
    expect(transformers.length).toBeGreaterThan(0);
  });

  it('includes notation-diff transformer', () => {
    const transformers = getEditorTransformers();
    const names = transformers.map((t) => t.name);
    expect(names).toContain('@shikijs/transformers:notation-diff');
  });

  it('includes notation-highlight transformer', () => {
    const transformers = getEditorTransformers();
    const names = transformers.map((t) => t.name);
    expect(names).toContain('@shikijs/transformers:notation-highlight');
  });
});

describe('highlightCode with transformers', () => {
  it('applies diff transformer to code with diff notation', async () => {
    const code = 'const x = 1; // [!code ++]';
    const html = await highlightCode(
      code,
      'typescript',
      getEditorTransformers()
    );
    expect(html).toContain('diff add');
  }, 15_000);

  it('applies highlight transformer to code with highlight notation', async () => {
    const code = 'const x = 1; // [!code highlight]';
    const html = await highlightCode(
      code,
      'typescript',
      getEditorTransformers()
    );
    expect(html).toContain('highlighted');
  }, 15_000);

  it('does not apply diff classes when no notation is present', async () => {
    const code = 'const x = 1;';
    const html = await highlightCode(
      code,
      'typescript',
      getEditorTransformers()
    );
    expect(html).not.toContain('diff add');
    expect(html).not.toContain('diff remove');
  }, 15_000);
});
