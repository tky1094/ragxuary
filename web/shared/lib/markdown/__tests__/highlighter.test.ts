import { describe, expect, it } from 'vitest';

import { buildCodeOptions, SHIKI_CONFIG } from '../highlighter';

describe('SHIKI_CONFIG', () => {
  it('should have everforest themes', () => {
    expect(SHIKI_CONFIG.themes.light).toBe('everforest-light');
    expect(SHIKI_CONFIG.themes.dark).toBe('everforest-dark');
  });

  it('should disable defaultColor for CSS variable mode', () => {
    expect(SHIKI_CONFIG.defaultColor).toBe(false);
  });

  it('should have text as default language', () => {
    expect(SHIKI_CONFIG.defaultLanguage).toBe('text');
  });
});

describe('buildCodeOptions', () => {
  it('should build options with specified language', () => {
    const options = buildCodeOptions('typescript');
    expect(options.lang).toBe('typescript');
    // Verify themes and defaultColor via runtime check (union type)
    expect('themes' in options && options.themes).toEqual(SHIKI_CONFIG.themes);
    expect('defaultColor' in options && options.defaultColor).toBe(false);
  });

  it('should allow overrides', () => {
    const options = buildCodeOptions('typescript', {
      transformers: [],
    });
    expect(options.transformers).toEqual([]);
  });
});
