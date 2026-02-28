import rehypeShiki from '@shikijs/rehype';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { SHIKI_CONFIG } from './highlighter';
import { rehypeMermaidCodeBlock } from './rehype-mermaid-code-block';
import type { ProcessMarkdownOptions } from './types';

/**
 * Process markdown to HTML on the server using unified pipeline.
 *
 * Includes:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Syntax highlighting via Shiki (everforest-light / everforest-dark)
 * - Heading IDs and anchor links (opt-out via `anchorLinks: false`)
 */
export async function processMarkdown(
  content: string,
  options?: ProcessMarkdownOptions
): Promise<string> {
  const { anchorLinks = true } = options ?? {};

  const shikiOptions = {
    themes: SHIKI_CONFIG.themes,
    defaultColor: SHIKI_CONFIG.defaultColor,
    defaultLanguage: SHIKI_CONFIG.defaultLanguage,
    addLanguageClass: SHIKI_CONFIG.addLanguageClass,
  };

  // Build two separate pipelines to keep unified's progressive types happy
  const result = await (anchorLinks
    ? unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeMermaidCodeBlock)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, {
          behavior: 'prepend' as const,
          properties: {
            className: ['anchor-link'],
            ariaHidden: true,
            tabIndex: -1,
          },
          content: { type: 'text', value: '#' },
        })
        .use(rehypeShiki, shikiOptions)
        .use(rehypeStringify)
    : unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeMermaidCodeBlock)
        .use(rehypeShiki, shikiOptions)
        .use(rehypeStringify)
  ).process(content);

  return String(result);
}
