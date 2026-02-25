'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { highlightMarkdownAction } from '@/shared/lib/markdown/actions';
import { cn } from '@/shared/lib/utils';

import { CodeBlockActions } from './CodeBlockActions';

interface MarkdownRendererClientProps {
  /** Raw markdown content */
  content: string;
  /** Whether content is still being streamed */
  isStreaming?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Client Component Markdown renderer for AI chat and streaming contexts.
 *
 * Behavior:
 * - During streaming (isStreaming=true): renders plain text in a <pre> block
 * - After streaming completes (isStreaming=false): invokes Server Action
 *   to highlight the full content with Shiki, then swaps in the HTML
 *
 * Anchor links (heading IDs + # links) are disabled since they are
 * not useful in chat or editor preview contexts.
 */
export function MarkdownRendererClient({
  content,
  isStreaming = false,
  className,
}: MarkdownRendererClientProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const lastContentRef = useRef<string>('');

  const highlight = useCallback(async (markdown: string) => {
    const html = await highlightMarkdownAction(markdown, {
      anchorLinks: false,
    });
    setHighlightedHtml(html);
  }, []);

  useEffect(() => {
    // Only highlight when streaming completes and content has changed
    if (!isStreaming && content && content !== lastContentRef.current) {
      lastContentRef.current = content;
      highlight(content);
    }
  }, [isStreaming, content, highlight]);

  // Prose classes shared with MarkdownRenderer (RSC), minus anchor-link styles
  const proseClasses = cn(
    'prose dark:prose-invert max-w-none',
    // Style prose <pre> as a bordered container for Shiki code blocks
    'prose-pre:overflow-hidden prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-pre:bg-transparent prose-pre:p-0',
    // Inline code styling
    'prose-code:before:content-none prose-code:after:content-none',
    'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm',
    // Exclude code inside pre (Shiki code blocks) from inline styling
    'prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0',
    className
  );

  // During streaming or before highlighting completes: plain text
  if (isStreaming || !highlightedHtml) {
    return (
      <div className={proseClasses}>
        <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
      </div>
    );
  }

  // After highlighting: rich HTML
  return (
    <div className={proseClasses}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated server-side by unified pipeline */}
      <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      <CodeBlockActions />
    </div>
  );
}
