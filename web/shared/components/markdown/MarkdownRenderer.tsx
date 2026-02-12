'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import type { MarkdownRendererProps } from '@/shared/lib/markdown/types';
import { cn } from '@/shared/lib/utils';

import { CodeBlock } from './CodeBlock';

const defaultComponents: Partial<Components> = {
  code: CodeBlock,
};

/**
 * Shared Markdown renderer built on react-markdown.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Syntax highlighting via highlight.js
 * - Heading anchors with auto-link
 * - Copy-to-clipboard for code blocks
 * - Dark mode support (prose-invert)
 *
 * Customizable via `componentOverrides` for feature-specific needs
 * (e.g., citation links in RAG chat).
 */
export function MarkdownRenderer({
  content,
  className,
  componentOverrides,
}: MarkdownRendererProps) {
  const components: Partial<Components> = {
    ...defaultComponents,
    ...componentOverrides,
  };

  return (
    <div
      className={cn(
        'prose dark:prose-invert max-w-none',
        // Reset prose <pre> styles to avoid conflict with highlight.js
        'prose-pre:bg-transparent prose-pre:p-0',
        // Remove decorative backticks added by Typography plugin
        'prose-code:before:content-none prose-code:after:content-none',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeHighlight,
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
