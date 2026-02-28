import { processMarkdown } from '@/shared/lib/markdown/process-markdown';
import type { MarkdownRendererProps } from '@/shared/lib/markdown/types';
import { cn } from '@/shared/lib/utils';

import { CodeBlockActions } from './CodeBlockActions';
import { MermaidRenderer } from './MermaidRenderer';

/**
 * Server Component Markdown renderer using unified pipeline.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Syntax highlighting via Shiki (everforest-light / everforest-dark)
 * - Heading anchors with auto-link
 * - Copy-to-clipboard for code blocks (via CodeBlockActions client component)
 * - Dark mode support (prose-invert)
 *
 * Shiki highlighting runs on the server — no WASM or grammar bundles
 * are shipped to the client.
 */
export async function MarkdownRenderer({
  content,
  className,
}: Omit<MarkdownRendererProps, 'componentOverrides'>) {
  const html = await processMarkdown(content);

  return (
    <div
      className={cn(
        'prose dark:prose-invert max-w-none',
        // Style prose <pre> as a bordered container for Shiki code blocks
        'prose-pre:overflow-hidden prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-pre:bg-transparent prose-pre:p-0',
        // Inline code styling
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm',
        // Exclude code inside pre (Shiki code blocks) from inline styling
        'prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0',
        // Heading anchor links: hidden by default, visible on heading hover
        '[&_:is(h1,h2,h3,h4,h5,h6)]:relative',
        '[&_.anchor-link]:absolute [&_.anchor-link]:right-full [&_.anchor-link]:pr-1 [&_.anchor-link]:opacity-0 [&_.anchor-link]:transition-opacity [&_.anchor-link]:duration-150',
        '[&_.anchor-link]:font-normal [&_.anchor-link]:text-muted-foreground [&_.anchor-link]:no-underline',
        '[&_:is(h1,h2,h3,h4,h5,h6):hover_.anchor-link]:opacity-70',
        className
      )}
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated server-side by unified pipeline with sanitized markdown */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <CodeBlockActions />
      <MermaidRenderer />
    </div>
  );
}
