import GithubSlugger from 'github-slugger';

import type { Heading } from './types';

const HEADING_REGEX = /^(#{2,4})\s+(.+)$/gm;

/**
 * Extract h2-h4 headings from raw Markdown content.
 *
 * Uses regex-based parsing to avoid heavy AST dependencies.
 * Heading IDs are generated with github-slugger to match
 * rehype-slug's output in MarkdownRenderer.
 */
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  for (const match of markdown.matchAll(HEADING_REGEX)) {
    const level = match[1].length as 2 | 3 | 4;
    const text = match[2].trim();
    const id = slugger.slug(text);
    headings.push({ id, text, level });
  }

  return headings;
}
