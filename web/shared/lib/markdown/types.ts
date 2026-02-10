import type { Components } from 'react-markdown';

/**
 * Represents a heading extracted from a Markdown document.
 * Used for building a table of contents.
 */
export interface Heading {
  /** URL-safe slug ID (matches rehype-slug output) */
  id: string;
  /** Raw text content of the heading */
  text: string;
  /** Heading depth (2 = h2, 3 = h3, 4 = h4) */
  level: 2 | 3 | 4;
}

/**
 * Props for the MarkdownRenderer component.
 */
export interface MarkdownRendererProps {
  /** Raw markdown content to render */
  content: string;
  /** Additional CSS class names for the wrapper element */
  className?: string;
  /**
   * Override specific react-markdown components.
   * Useful for features like chat to customize link rendering
   * for citation display.
   */
  componentOverrides?: Partial<Components>;
}
