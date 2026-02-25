import { codeToHtml } from 'shiki';

import { buildCodeOptions } from './highlighter';

/**
 * Highlight a single code block to HTML using Shiki.
 *
 * Bypasses the full Markdown pipeline — intended for the editor
 * preview panel and other cases where only code highlighting is needed.
 *
 * @param code - The source code text
 * @param lang - Language identifier (e.g. 'typescript', 'python')
 * @returns HTML string with Shiki-highlighted code
 */
export async function highlightCode(
  code: string,
  lang = 'text'
): Promise<string> {
  return codeToHtml(code, buildCodeOptions(lang));
}
