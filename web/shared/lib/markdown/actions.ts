'use server';

import { processMarkdown } from './process-markdown';
import type { ProcessMarkdownOptions } from './types';

/**
 * Server Action: highlight Markdown content on the server.
 *
 * Allows client components to invoke the full unified pipeline
 * (Shiki + GFM + optionally heading anchors) without shipping
 * WASM or grammar bundles to the client.
 */
export async function highlightMarkdownAction(
  content: string,
  options?: ProcessMarkdownOptions
): Promise<string> {
  return processMarkdown(content, options);
}
