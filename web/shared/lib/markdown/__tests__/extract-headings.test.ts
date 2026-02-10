import { describe, expect, it } from 'vitest';

import { extractHeadings } from '@/shared/lib/markdown/extract-headings';

describe('extractHeadings', () => {
  it('should extract h2-h4 headings from markdown', () => {
    const markdown = '## Heading 2\n### Heading 3\n#### Heading 4';
    const result = extractHeadings(markdown);

    expect(result).toEqual([
      { id: 'heading-2', text: 'Heading 2', level: 2 },
      { id: 'heading-3', text: 'Heading 3', level: 3 },
      { id: 'heading-4', text: 'Heading 4', level: 4 },
    ]);
  });

  it('should ignore h1 and h5+ headings', () => {
    const markdown = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const result = extractHeadings(markdown);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ text: 'H2', level: 2 });
    expect(result[1]).toMatchObject({ text: 'H3', level: 3 });
    expect(result[2]).toMatchObject({ text: 'H4', level: 4 });
  });

  it('should generate slugs matching github-slugger output', () => {
    const markdown = '## Hello World\n## Getting Started';
    const result = extractHeadings(markdown);

    expect(result[0].id).toBe('hello-world');
    expect(result[1].id).toBe('getting-started');
  });

  it('should handle duplicate heading text with incremented slugs', () => {
    const markdown = '## Section\n## Section\n## Section';
    const result = extractHeadings(markdown);

    expect(result[0].id).toBe('section');
    expect(result[1].id).toBe('section-1');
    expect(result[2].id).toBe('section-2');
  });

  it('should return empty array for markdown without headings', () => {
    const markdown = 'Just some text\n\nAnother paragraph';
    const result = extractHeadings(markdown);

    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(extractHeadings('')).toEqual([]);
  });

  it('should handle headings with special characters', () => {
    const markdown = "## What's New? (2024)";
    const result = extractHeadings(markdown);

    expect(result[0]).toMatchObject({
      text: "What's New? (2024)",
      level: 2,
    });
    expect(result[0].id).toBe('whats-new-2024');
  });

  it('should handle headings with inline code', () => {
    const markdown = '## `useState` Hook';
    const result = extractHeadings(markdown);

    expect(result[0]).toMatchObject({
      text: '`useState` Hook',
      level: 2,
    });
  });
});
