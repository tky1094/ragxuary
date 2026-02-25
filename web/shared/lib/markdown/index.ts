export { highlightMarkdownAction } from './actions';
export { extractHeadings } from './extract-headings';
export { highlightCode } from './highlight-code';
export type { SupportedLanguage } from './highlighter';
export { buildCodeOptions, SHIKI_CONFIG } from './highlighter';
export { processMarkdown } from './process-markdown';
export type {
  Heading,
  MarkdownRendererProps,
  ProcessMarkdownOptions,
} from './types';
