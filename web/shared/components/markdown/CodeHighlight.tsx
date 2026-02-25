import { highlightCode } from '@/shared/lib/markdown/highlight-code';
import { cn } from '@/shared/lib/utils';

import { CodeBlockActions } from './CodeBlockActions';

interface CodeHighlightProps {
  /** Source code to highlight */
  code: string;
  /** Language identifier (e.g. 'typescript', 'python') */
  lang?: string;
  /** Additional CSS class names for the wrapper */
  className?: string;
}

/**
 * Server Component for rendering a single highlighted code block.
 *
 * Uses highlightCode() (Shiki codeToHtml) to avoid the full Markdown
 * pipeline. Includes CodeBlockActions for language label and copy button.
 *
 * Intended for the editor preview panel where only code highlighting
 * is needed, not full Markdown rendering.
 */
export async function CodeHighlight({
  code,
  lang = 'text',
  className,
}: CodeHighlightProps) {
  const html = await highlightCode(code, lang);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border',
        '[&_.shiki]:!bg-transparent',
        className
      )}
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated server-side by Shiki codeToHtml */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <CodeBlockActions />
    </div>
  );
}
