'use client';

import { Check, Copy } from 'lucide-react';
import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';

type CodeBlockProps = ComponentPropsWithoutRef<'code'>;

/**
 * Code block component used as a react-markdown `code` override.
 *
 * - Inline code: renders a styled `<code>` element.
 * - Block code: renders with a language label and copy-to-clipboard button.
 *   Detected by `language-*` className or Shiki-processed React element children.
 */
export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const language = className?.match(/language-(\w+)/)?.[1] ?? '';
  const isBlock = !!language || hasElementChildren(children);

  const handleCopy = useCallback(async () => {
    const text = extractTextContent(children);
    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [children]);

  // Inline code
  if (!isBlock) {
    return (
      <code
        className={cn(
          'rounded bg-muted px-1.5 py-0.5 font-mono text-foreground text-sm',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  // Block code with language label and copy button
  return (
    <>
      <div className="flex items-center justify-between rounded-t-lg border-border border-b bg-muted px-4 py-2 text-muted-foreground text-xs">
        <span>{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 transition-colors hover:text-foreground"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <code className={cn('block rounded-t-none! p-4', className)} {...props}>
        {children}
      </code>
    </>
  );
}

/**
 * Check if children contain React elements (e.g. Shiki span output),
 * indicating this is a block code element even without a language class.
 */
function hasElementChildren(children: React.ReactNode): boolean {
  if (Array.isArray(children)) {
    return children.some(
      (child) => typeof child === 'object' && child !== null
    );
  }
  return typeof children === 'object' && children !== null;
}

/**
 * Extract plain text content from React children.
 */
function extractTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractTextContent).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextContent(
      (children as React.ReactElement<{ children?: React.ReactNode }>).props
        .children
    );
  }
  return '';
}
