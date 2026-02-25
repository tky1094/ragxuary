import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import type { ShikiTransformer } from 'shiki';

/**
 * Returns Shiki transformers for the document editor.
 *
 * Includes:
 * - **Diff notation** — `// [!code ++]` / `// [!code --]`
 * - **Line highlight** — `// [!code highlight]`
 *
 * These are NOT included in the default `processMarkdown` pipeline
 * (docs viewer does not need diff/highlight notation).
 * Pass them explicitly to `highlightCode`:
 *
 * ```ts
 * highlightCode(code, lang, getEditorTransformers())
 * ```
 */
export function getEditorTransformers(): ShikiTransformer[] {
  return [transformerNotationDiff(), transformerNotationHighlight()];
}
