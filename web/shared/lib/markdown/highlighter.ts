import type { BundledLanguage, BundledTheme, CodeToHastOptions } from 'shiki';

/**
 * Centralized Shiki configuration — single source of truth
 * for theme and language settings used by processMarkdown,
 * highlightCode, and rehypeShiki.
 */
export const SHIKI_CONFIG = {
  themes: {
    light: 'everforest-light' as const satisfies BundledTheme,
    dark: 'everforest-dark' as const satisfies BundledTheme,
  },
  defaultColor: false as const,
  defaultLanguage: 'text',
  addLanguageClass: true,
} as const;

/** Type alias for supported Shiki languages */
export type SupportedLanguage = BundledLanguage;

/**
 * Build CodeToHastOptions for codeToHtml from SHIKI_CONFIG.
 * Merges base config with per-call overrides (lang, transformers, etc.)
 */
export function buildCodeOptions(
  lang: string,
  overrides?: Partial<CodeToHastOptions<BundledLanguage, BundledTheme>>
): CodeToHastOptions<BundledLanguage, BundledTheme> {
  return {
    lang: lang as BundledLanguage,
    themes: SHIKI_CONFIG.themes,
    defaultColor: SHIKI_CONFIG.defaultColor,
    ...overrides,
  };
}
