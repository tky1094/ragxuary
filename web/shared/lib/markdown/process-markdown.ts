import rehypeShiki from '@shikijs/rehype';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * Process markdown to HTML on the server using unified pipeline.
 *
 * Includes:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Syntax highlighting via Shiki (everforest-light / everforest-dark)
 * - Heading IDs (rehype-slug) with prepend anchor links
 */
export async function processMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
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
    .use(rehypeShiki, {
      themes: {
        light: 'everforest-light',
        dark: 'everforest-dark',
      },
      defaultColor: false,
      defaultLanguage: 'text',
      addLanguageClass: true,
    })
    .use(rehypeStringify)
    .process(content);

  return String(result);
}
